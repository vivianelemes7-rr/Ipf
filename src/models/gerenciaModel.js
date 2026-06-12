const db = require('../config/database');

function montarFiltrosPedidos(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.status) {
        where.push('p.status_pedido = ?');
        params.push(filtros.status);
    }

    if (filtros.vendedor_id) {
        where.push('crm.vendedor_id = ?');
        params.push(filtros.vendedor_id);
    }

    if (filtros.data_inicio) {
        where.push('DATE(p.data_pedido) >= ?');
        params.push(filtros.data_inicio);
    }

    if (filtros.data_fim) {
        where.push('DATE(p.data_pedido) <= ?');
        params.push(filtros.data_fim);
    }

    if (filtros.prioridade) {
        where.push('(crm.prioridade = ? OR ka.prioridade = ?)');
        params.push(filtros.prioridade, filtros.prioridade);
    }

    if (filtros.setor) {
        const setor = String(filtros.setor).trim().toLowerCase();
        if (setor === 'comercial' || setor === 'vendas') where.push('crm.id IS NOT NULL');
        if (setor === 'financeiro') where.push('kf.id IS NOT NULL');
        if (setor === 'arquitetura') where.push('ka.id IS NOT NULL');
        if (setor === 'producao' || setor === 'produção') where.push('kp.id IS NOT NULL');
    }

    return {
        where: where.length ? `WHERE ${where.join(' AND ')}` : '',
        params
    };
}

class GerenciaModel {
    static async painelConsolidado(filtros = {}) {
        const { where, params } = montarFiltrosPedidos(filtros);
        const [rows] = await db.query(
            `SELECT
                p.id AS pedido_id,
                p.numero_pedido,
                p.tipo_pedido,
                p.status_pedido,
                p.data_pedido,
                p.valor_total_fechado,
                COALESCE(l.empresa, l.nome_contato) AS cliente_nome,
                crm.id AS crm_id,
                crm.etapa_kanban AS comercial_etapa,
                crm.prioridade AS comercial_prioridade,
                vend.id AS vendedor_id,
                vend.nome AS vendedor_nome,
                kf.id AS financeiro_id,
                kf.etapa_kanban AS financeiro_etapa,
                fin.id AS responsavel_fin_id,
                fin.nome AS responsavel_financeiro_nome,
                ka.id AS arquitetura_id,
                ka.etapa_kanban AS arquitetura_etapa,
                arq.id AS arquiteto_id,
                arq.nome AS arquiteto_nome,
                kp.id AS producao_id,
                kp.etapa_kanban AS producao_etapa,
                prod.id AS responsavel_producao_id,
                prod.nome AS responsavel_producao_nome,
                kp.previsao_entrega_final
             FROM pedidos p
             LEFT JOIN leads l ON l.id = p.lead_id
             LEFT JOIN crm_comercial crm ON crm.id = p.crm_id
             LEFT JOIN funcionarios vend ON vend.id = crm.vendedor_id
             LEFT JOIN kanban_financeiro kf ON kf.pedido_id = p.id
             LEFT JOIN funcionarios fin ON fin.id = kf.responsavel_fin_id
             LEFT JOIN kanban_arquitetura ka ON ka.pedido_id = p.id
             LEFT JOIN funcionarios arq ON arq.id = ka.arquiteto_id
             LEFT JOIN kanban_producao kp ON kp.pedido_id = p.id
             LEFT JOIN funcionarios prod ON prod.id = kp.responsavel_producao_id
             ${where}
             ORDER BY p.data_pedido DESC`,
            params
        );
        return rows;
    }

    static async indicadores() {
        const [[porStatus], [comercial], [financeiro], [arquitetura], [producao]] = await Promise.all([
            db.query('SELECT status_pedido AS chave, COUNT(*) AS total FROM pedidos GROUP BY status_pedido'),
            db.query('SELECT etapa_kanban AS chave, COUNT(*) AS total FROM crm_comercial GROUP BY etapa_kanban'),
            db.query('SELECT etapa_kanban AS chave, COUNT(*) AS total FROM kanban_financeiro GROUP BY etapa_kanban'),
            db.query('SELECT etapa_kanban AS chave, COUNT(*) AS total FROM kanban_arquitetura GROUP BY etapa_kanban'),
            db.query('SELECT etapa_kanban AS chave, COUNT(*) AS total FROM kanban_producao GROUP BY etapa_kanban')
        ]);

        return { porStatus, comercial, financeiro, arquitetura, producao };
    }

    static async listarPedidosParados(diasLimite = 7) {
        const [rows] = await db.query(
            `SELECT * FROM (
                SELECT p.id AS pedido_id, p.numero_pedido, 'Comercial' AS setor, crm.etapa_kanban AS etapa,
                       crm.vendedor_id AS responsavel_id, vend.nome AS responsavel_nome,
                       COALESCE(crm.data_entrada_etapa, crm.data_movimentacao) AS ultima_movimentacao,
                       DATEDIFF(NOW(), COALESCE(crm.data_entrada_etapa, crm.data_movimentacao)) AS dias_parado
                FROM crm_comercial crm
                LEFT JOIN pedidos p ON p.crm_id = crm.id
                LEFT JOIN funcionarios vend ON vend.id = crm.vendedor_id
                WHERE crm.status_final = 'Em Aberto'
                  AND COALESCE(crm.data_entrada_etapa, crm.data_movimentacao) < DATE_SUB(NOW(), INTERVAL ? DAY)
                UNION ALL
                SELECT p.id AS pedido_id, p.numero_pedido, 'Financeiro' AS setor, kf.etapa_kanban AS etapa,
                       kf.responsavel_fin_id AS responsavel_id, fin.nome AS responsavel_nome,
                       kf.ultima_atualizacao AS ultima_movimentacao,
                       DATEDIFF(NOW(), kf.ultima_atualizacao) AS dias_parado
                FROM kanban_financeiro kf
                JOIN pedidos p ON p.id = kf.pedido_id
                LEFT JOIN funcionarios fin ON fin.id = kf.responsavel_fin_id
                WHERE kf.ultima_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)
                UNION ALL
                SELECT p.id AS pedido_id, p.numero_pedido, 'Arquitetura' AS setor, ka.etapa_kanban AS etapa,
                       ka.arquiteto_id AS responsavel_id, arq.nome AS responsavel_nome,
                       ka.ultima_movimentacao AS ultima_movimentacao,
                       DATEDIFF(NOW(), ka.ultima_movimentacao) AS dias_parado
                FROM kanban_arquitetura ka
                JOIN pedidos p ON p.id = ka.pedido_id
                LEFT JOIN funcionarios arq ON arq.id = ka.arquiteto_id
                WHERE ka.ultima_movimentacao < DATE_SUB(NOW(), INTERVAL ? DAY)
                UNION ALL
                SELECT p.id AS pedido_id, p.numero_pedido, 'Producao' AS setor, kp.etapa_kanban AS etapa,
                       kp.responsavel_producao_id AS responsavel_id, prod.nome AS responsavel_nome,
                       kp.ultima_atualizacao AS ultima_movimentacao,
                       DATEDIFF(NOW(), kp.ultima_atualizacao) AS dias_parado
                FROM kanban_producao kp
                JOIN pedidos p ON p.id = kp.pedido_id
                LEFT JOIN funcionarios prod ON prod.id = kp.responsavel_producao_id
                WHERE kp.etapa_kanban NOT IN ('Finalizado', 'Cancelado')
                  AND kp.ultima_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)
            ) parados
            ORDER BY dias_parado DESC`,
            [diasLimite, diasLimite, diasLimite, diasLimite]
        );
        return rows;
    }

    static async listarPedidosAtrasados() {
        const [rows] = await db.query(
            `SELECT * FROM (
                SELECT p.id AS pedido_id, p.numero_pedido, 'Comercial' AS setor, crm.etapa_kanban AS etapa,
                       crm.previsao_fechamento AS data_limite, vend.nome AS responsavel_nome
                FROM crm_comercial crm
                LEFT JOIN pedidos p ON p.crm_id = crm.id
                LEFT JOIN funcionarios vend ON vend.id = crm.vendedor_id
                WHERE crm.status_final = 'Em Aberto' AND crm.previsao_fechamento < CURDATE()
                UNION ALL
                SELECT p.id, p.numero_pedido, 'Financeiro', kf.etapa_kanban,
                       kf.data_vencimento_proxima, fin.nome
                FROM kanban_financeiro kf
                JOIN pedidos p ON p.id = kf.pedido_id
                LEFT JOIN funcionarios fin ON fin.id = kf.responsavel_fin_id
                WHERE kf.data_vencimento_proxima < CURDATE()
                UNION ALL
                SELECT p.id, p.numero_pedido, 'Arquitetura', ka.etapa_kanban,
                       ka.data_entrega_prevista, arq.nome
                FROM kanban_arquitetura ka
                JOIN pedidos p ON p.id = ka.pedido_id
                LEFT JOIN funcionarios arq ON arq.id = ka.arquiteto_id
                WHERE ka.data_entrega_prevista < CURDATE()
                UNION ALL
                SELECT p.id, p.numero_pedido, 'Producao', kp.etapa_kanban,
                       kp.previsao_entrega_final, prod.nome
                FROM kanban_producao kp
                JOIN pedidos p ON p.id = kp.pedido_id
                LEFT JOIN funcionarios prod ON prod.id = kp.responsavel_producao_id
                WHERE kp.etapa_kanban NOT IN ('Finalizado', 'Cancelado')
                  AND kp.previsao_entrega_final < CURDATE()
            ) atrasados
            ORDER BY data_limite ASC`
        );
        return rows;
    }

    static async visaoPorVendedor() {
        const [rows] = await db.query(
            `SELECT vend.id AS vendedor_id,
                    vend.nome AS vendedor_nome,
                    COUNT(crm.id) AS total_cards,
                    SUM(crm.status_final = 'Ganho') AS ganhos,
                    SUM(crm.status_final = 'Perdido') AS perdidos,
                    COALESCE(SUM(CASE WHEN crm.status_final = 'Ganho' THEN crm.valor_estimado ELSE 0 END), 0) AS valor_ganho
             FROM crm_comercial crm
             LEFT JOIN funcionarios vend ON vend.id = crm.vendedor_id
             GROUP BY vend.id, vend.nome
             ORDER BY valor_ganho DESC, total_cards DESC`
        );
        return rows;
    }

    static async visaoPorResponsavel() {
        const [rows] = await db.query(
            `SELECT 'Financeiro' AS setor, fin.id AS funcionario_id, fin.nome AS funcionario_nome, COUNT(kf.id) AS total_cards
             FROM kanban_financeiro kf
             LEFT JOIN funcionarios fin ON fin.id = kf.responsavel_fin_id
             GROUP BY fin.id, fin.nome
             UNION ALL
             SELECT 'Arquitetura', arq.id, arq.nome, COUNT(ka.id)
             FROM kanban_arquitetura ka
             LEFT JOIN funcionarios arq ON arq.id = ka.arquiteto_id
             GROUP BY arq.id, arq.nome
             UNION ALL
             SELECT 'Producao', prod.id, prod.nome, COUNT(kp.id)
             FROM kanban_producao kp
             LEFT JOIN funcionarios prod ON prod.id = kp.responsavel_producao_id
             GROUP BY prod.id, prod.nome
             ORDER BY setor, total_cards DESC`
        );
        return rows;
    }

    static async listarSlaComercialEstourado(diasLimite = 7) {
        const [rows] = await db.query(
            `SELECT crm.id AS crm_id,
                    p.id AS pedido_id,
                    p.numero_pedido,
                    crm.etapa_kanban,
                    crm.vendedor_id,
                    vend.nome AS vendedor_nome,
                    l.nome_contato,
                    DATEDIFF(NOW(), COALESCE(crm.data_entrada_etapa, crm.data_movimentacao)) AS dias_parado
             FROM crm_comercial crm
             LEFT JOIN pedidos p ON p.crm_id = crm.id
             LEFT JOIN leads l ON l.id = crm.lead_id
             LEFT JOIN funcionarios vend ON vend.id = crm.vendedor_id
             WHERE crm.status_final = 'Em Aberto'
               AND crm.etapa_kanban IN ('Contato', 'Orcamento')
               AND COALESCE(crm.data_entrada_etapa, crm.data_movimentacao) < DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY dias_parado DESC`,
            [diasLimite]
        );
        return rows;
    }

    static async resumosSetoriais(diasLimite = 7) {
        const [[vendas], [arquitetura], [financeiro], [producao]] = await Promise.all([
            db.query(
                `SELECT
                    COUNT(*) AS cards_em_aberto,
                    SUM(etapa_kanban = 'Contato') AS leads_contato,
                    SUM(etapa_kanban = 'Orcamento') AS leads_orcamento,
                    SUM(
                        etapa_kanban IN ('Contato', 'Orcamento')
                        AND COALESCE(data_entrada_etapa, data_movimentacao) < DATE_SUB(NOW(), INTERVAL ? DAY)
                    ) AS slas_estourados
                 FROM crm_comercial
                 WHERE status_final = 'Em Aberto'`,
                [diasLimite]
            ),
            db.query(
                `SELECT
                    COUNT(*) AS cards_arquitetura,
                    SUM(requer_matriz_externa = TRUE AND matriz_recebida_check = FALSE) AS matrizes_pendentes,
                    SUM(ultima_movimentacao < DATE_SUB(NOW(), INTERVAL ? DAY)) AS cards_parados,
                    SUM(data_entrega_prevista IS NOT NULL AND data_entrega_prevista < CURDATE()) AS entregas_atrasadas
                 FROM kanban_arquitetura`,
                [diasLimite]
            ),
            db.query(
                `SELECT
                    COUNT(*) AS cards_financeiros,
                    SUM(liberado_para_producao = FALSE) AS pendencias_validacao,
                    SUM(liberado_para_producao = TRUE) AS liberados_producao,
                    SUM(etapa_kanban IN ('Alerta Fiscal', 'Emissao de NF', 'Emissão de NF', 'Fiscal') OR status_pagamento = 'Fiscal') AS pendencias_fiscais
                 FROM kanban_financeiro`
            ),
            db.query(
                `SELECT
                    COUNT(*) AS cards_producao,
                    SUM(etapa_kanban IN ('Aguardando Liberacao', 'Aguardando Matriz', 'Fila de Corte')) AS fila,
                    SUM(etapa_kanban = 'Fabricacao') AS fabricacao,
                    SUM(etapa_kanban = 'Expedicao') AS expedicao,
                    SUM(
                        previsao_entrega_final IS NOT NULL
                        AND previsao_entrega_final < CURDATE()
                        AND etapa_kanban NOT IN ('Finalizado', 'Cancelado')
                    ) AS atrasos_entrega
                 FROM kanban_producao`
            )
        ]);

        return {
            vendas: vendas[0] || {},
            arquitetura: arquitetura[0] || {},
            financeiro: financeiro[0] || {},
            producao: producao[0] || {}
        };
    }

    static async buscarGestores() {
        const [rows] = await db.query(
            `SELECT id, nome, cargo
             FROM funcionarios
             WHERE status_ativo = TRUE
               AND cargo IN ('Gerente', 'Administrador')`
        );
        return rows;
    }
}

module.exports = GerenciaModel;
