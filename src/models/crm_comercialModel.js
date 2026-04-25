const db = require('../config/database'); // Importa a conexão pool

class CRMComercialModel {
    // Busca todos os registros do CRM com nomes de referências (Lead e Vendedor)
    static async findAll() {
        const query = `SELECT crm.*, l.nome AS lead_nome, f.nome AS vendedor_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
            ORDER BY crm.prioridade ASC, crm.data_movimentacao DESC`;
        const [rows] = await db.query(query);
        return rows;
    }

    // Busca registros filtrados por vendedor (Respeitando a regra 'ver_apenas_proprio')
    static async findByVendedor(vendedor_id) {
        const query = `
            SELECT crm.*, l.nome AS lead_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            WHERE crm.vendedor_id = ?
        `;
        const [rows] = await db.query(query, [vendedor_id]);
        return rows;
    }

    // Busca um registro pelo número único do pedido
    static async findByNumeroPedido(numero_pedido) {
        const query = `
            SELECT crm.*, l.nome AS lead_nome, f.nome AS vendedor_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
            WHERE crm.numero_pedido = ?
        `;
        const [rows] = await db.query(query, [numero_pedido]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM crm_comercial WHERE id = ?', [id]);
        return rows[0];
    }

    // Cria um novo card no Kanban (Atualizado com numero_pedido)
    static async create(dados) {
        const {
            lead_id,
            vendedor_id,
            etapa_kanban,
            valor_estimado,
            prioridade,
            previsao_fechamento,
            proposta_url,
            observacoes_venda,
            numero_pedido // Adicionado
        } = dados;

        const query = `INSERT INTO crm_comercial 
            (lead_id, vendedor_id, etapa_kanban, valor_estimado, prioridade, previsao_fechamento, proposta_url, observacoes_venda, numero_pedido) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(query, [
            lead_id,
            vendedor_id || null,
            etapa_kanban || 'Triagem',
            valor_estimado || 0,
            prioridade || 2,
            previsao_fechamento || null,
            proposta_url || null,
            observacoes_venda || null,
            numero_pedido || null // Adicionado
        ]);

        return result.insertId;
    }

    // Atualiza dados do card (Atualizado com numero_pedido)
    static async update(id, dados) {
        const {
            etapa_kanban,
            valor_estimado,
            prioridade,
            previsao_fechamento,
            proposta_url,
            status_final,
            motivo_perda,
            pedido_gerado,
            observacoes_venda,
            vendedor_id,
            numero_pedido // Adicionado
        } = dados;

        const query = `UPDATE crm_comercial SET 
                etapa_kanban = ?, 
                valor_estimado = ?, 
                prioridade = ?, 
                previsao_fechamento = ?, 
                proposta_url = ?, 
                status_final = ?, 
                motivo_perda = ?, 
                pedido_gerado = ?, 
                observacoes_venda = ?,
                vendedor_id = ?,
                numero_pedido = ? 
            WHERE id = ?
        `;

        const [result] = await db.query(query, [
            etapa_kanban,
            valor_estimado,
            prioridade,
            previsao_fechamento,
            proposta_url,
            status_final,
            motivo_perda,
            pedido_gerado,
            observacoes_venda,
            vendedor_id,
            numero_pedido, // Adicionado
            id
        ]);

        return result.affectedRows;
    }

    // Lógica de Fechamento (Atualizado para receber o número do pedido no ato do ganho)
    static async markAsWon(id, numero_pedido) {
        const query = `
            UPDATE crm_comercial SET 
                status_final = 'Ganho', 
                data_ganho = CURRENT_TIMESTAMP,
                etapa_kanban = 'Finalizado',
                pedido_gerado = TRUE,
                numero_pedido = ? 
            WHERE id = ?`;
        const [result] = await db.query(query, [numero_pedido, id]);
        return result.affectedRows;
    }

    // Lógica de Fechamento: Marca como Perdido com motivo
    static async markAsLost(id, motivo) {
        const query = `UPDATE crm_comercial SET 
                status_final = 'Perdido', 
                motivo_perda = ?,
                etapa_kanban = 'Arquivado'
            WHERE id = ?`;
        const [result] = await db.query(query, [motivo, id]);
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM crm_comercial WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = CRMComercialModel;