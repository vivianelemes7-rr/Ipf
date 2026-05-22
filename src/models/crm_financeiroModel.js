const db = require('../config/database'); // Importa a conexão pool

class CRMFinanceiroModel {
    // Busca todos os registros do Kanban Financeiro com os relacionamentos exatos da tabela pedidos
    static async findAll() {
        const query = `SELECT 
                kf.*, 
                p.numero_pedido, 
                p.tipo_pedido,                  -- 'Normal' ou 'Especial (Matriz)'
                p.valor_total_fechado,          -- Valor fechado no comercial
                p.contrato_url,                 -- Link do contrato assinado
                p.status_pedido,                -- Status atual do pedido
                l.nome_contato AS cliente_nome, -- Nome do cliente vindo direto de leads através do pedido
                f_fin.nome AS responsavel_financeiro_nome
            FROM kanban_financeiro kf
            LEFT JOIN pedidos p ON kf.pedido_id = p.id
            LEFT JOIN leads l ON p.lead_id = l.id
            LEFT JOIN funcionarios f_fin ON kf.responsavel_fin_id = f_fin.id
            ORDER BY kf.data_vencimento_proxima ASC, kf.ultima_atualizacao DESC;`;
        const [rows] = await db.query(query);
        return rows;
    }

    // Busca registros filtrados pelo responsável do financeiro
    static async findByResponsavelFin(responsavel_fin_id) {
        const query = `SELECT 
                kf.*, 
                p.numero_pedido, 
                p.tipo_pedido,
                l.nome_contato AS cliente_nome
            FROM kanban_financeiro kf
            LEFT JOIN pedidos p ON kf.pedido_id = p.id
            LEFT JOIN leads l ON p.lead_id = l.id
            WHERE kf.responsavel_fin_id = ?`;
        const [rows] = await db.query(query, [responsavel_fin_id]);
        return rows;
    }

    // Busca um registro específico pelo ID do Kanban com dados agregados do pedido
    static async findById(id) {
        const query = `SELECT 
                kf.*, 
                p.numero_pedido, 
                p.tipo_pedido,
                p.contrato_url,
                l.nome_contato AS cliente_nome
            FROM kanban_financeiro kf
            LEFT JOIN pedidos p ON kf.pedido_id = p.id
            LEFT JOIN leads l ON p.lead_id = l.id
            WHERE kf.id = ?`;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }

    // Busca registros pela etapa atual do Kanban
    static async findByEtapa(etapa_kanban) {
        const query = `SELECT 
                kf.*, 
                p.numero_pedido, 
                p.tipo_pedido,
                l.nome_contato AS cliente_nome
            FROM kanban_financeiro kf
            LEFT JOIN pedidos p ON kf.pedido_id = p.id
            LEFT JOIN leads l ON p.lead_id = l.id
            WHERE kf.etapa_kanban = ?`;
        const [rows] = await db.query(query, [etapa_kanban]);
        return rows;
    }

    // Cria um novo card no Kanban Financeiro
    static async create(dados) {
        const {
            pedido_id,
            responsavel_fin_id,
            etapa_kanban,
            valor_total_pedido,
            status_pagamento,
            custo_matriz_externa,
            matriz_externa_paga,
            liberado_para_producao,
            data_vencimento_proxima,
            observacoes_financeiras
        } = dados;

        const query = `INSERT INTO kanban_financeiro 
                (pedido_id, responsavel_fin_id, etapa_kanban, valor_total_pedido, status_pagamento, custo_matriz_externa, matriz_externa_paga, liberado_para_producao, data_vencimento_proxima, observacoes_financeiras) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(query, [
            pedido_id,
            responsavel_fin_id || null,
            etapa_kanban || 'Entrada',
            valor_total_pedido || 0.00,
            status_pagamento || 'Pendente',
            custo_matriz_externa || 0.00,
            matriz_externa_paga || false,
            liberado_para_producao || false,
            data_vencimento_proxima || null,
            observacoes_financeiras || null
        ]);

        return result.insertId;
    }

    // Atualiza os dados do card
    static async update(id, dados) {
        const {
            responsavel_fin_id,
            etapa_kanban,
            valor_total_pedido,
            status_pagamento,
            custo_matriz_externa,
            matriz_externa_paga,
            liberado_para_producao,
            data_vencimento_proxima,
            observacoes_financeiras
        } = dados;

        const query = `UPDATE kanban_financeiro SET 
                responsavel_fin_id = ?, 
                etapa_kanban = ?, 
                valor_total_pedido = ?, 
                status_pagamento = ?, 
                custo_matriz_externa = ?, 
                matriz_externa_paga = ?, 
                liberado_para_producao = ?, 
                data_vencimento_proxima = ?, 
                observacoes_financeiras = ?,
                ultima_atualizacao = CURRENT_TIMESTAMP
            WHERE id = ?`;

        const [result] = await db.query(query, [
            responsavel_fin_id,
            etapa_kanban,
            valor_total_pedido,
            status_pagamento,
            custo_matriz_externa,
            matriz_externa_paga,
            liberado_para_producao,
            data_vencimento_proxima,
            observacoes_financeiras,
            id
        ]);

        return result.affectedRows;
    }

    // GATILHO UC11: Liberar para Produção (Atualizado com Transação)
    static async liberarParaProducao(id) {
        // 1. Pega uma conexão dedicada do pool para gerenciar a transação
        const connection = await db.getConnection();
        
        try {
            // 2. Inicia a transação
            await connection.beginTransaction();

            // Query A: Atualiza o Kanban Financeiro
            const queryFinanceiro = `UPDATE kanban_financeiro SET 
                    liberado_para_producao = TRUE,
                    etapa_kanban = 'Confirmado UC11', -- Move automaticamente de coluna se desejar
                    ultima_atualizacao = CURRENT_TIMESTAMP
                WHERE id = ?`;
            const [resFinanceiro] = await connection.query(queryFinanceiro, [id]);

            if (resFinanceiro.affectedRows === 0) {
                throw new Error('Card do financeiro não encontrado.');
            }

            // Query B: Atualiza o status do Pedido vinculado para 'Produção'
            // Usamos uma subquery para achar o pedido_id correto baseado no ID do kanban_financeiro
            const queryPedido = `UPDATE pedidos 
                SET status_pedido = 'Produção'
                WHERE id = (SELECT pedido_id FROM kanban_financeiro WHERE id = ?)`;
            await connection.query(queryPedido, [id]);

            // 3. Se tudo deu certo, consolida as alterações no banco de dados
            await connection.commit();
            
            return resFinanceiro.affectedRows;

        } catch (error) {
            // 4. Se qualquer uma das queries falhar, desfaz tudo que foi feito nesta tentativa
            await connection.rollback();
            throw error; // Repassa o erro para o seu Controller tratar (ex: retornar status 500)
            
        } finally {
            // 5. IMPORTANTE: Libera a conexão de volta para o pool
            connection.release();
        }
    }

    // Método para atualizar o Status de Pagamento (Ex: Quitado, Parcial)
    static async atualizarStatusPagamento(id, status) {
        const query = `UPDATE kanban_financeiro SET 
                status_pagamento = ?,
                ultima_atualizacao = CURRENT_TIMESTAMP
            WHERE id = ?`;
        const [result] = await db.query(query, [status, id]);
        return result.affectedRows;
    }

    // Remove um card do Kanban Financeiro
    static async delete(id) {
        const [result] = await db.query('DELETE FROM kanban_financeiro WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = CRMFinanceiroModel;