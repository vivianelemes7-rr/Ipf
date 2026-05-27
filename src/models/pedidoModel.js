const db = require('../config/database');

const CAMPOS_ATUALIZAVEIS = [
    'tipo_pedido',
    'valor_total_fechado',
    'descricao_itens_servicos',
    'prazo_entrega_acordado',
    'contrato_url',
    'projeto_referencia_url'
];

function montarFiltrosPedidos(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.status_pedido) {
        where.push('p.status_pedido = ?');
        params.push(filtros.status_pedido);
    }

    if (filtros.cliente_id || filtros.lead_id) {
        where.push('p.lead_id = ?');
        params.push(filtros.cliente_id || filtros.lead_id);
    }

    if (filtros.tipo_pedido) {
        where.push('p.tipo_pedido = ?');
        params.push(filtros.tipo_pedido);
    }

    if (filtros.numero_pedido) {
        where.push('p.numero_pedido = ?');
        params.push(filtros.numero_pedido);
    }

    return {
        where: where.length ? `WHERE ${where.join(' AND ')}` : '',
        params
    };
}

function selectPedidoCompleto() {
    return `
        SELECT
            p.id,
            p.crm_id,
            p.lead_id,
            p.numero_pedido,
            p.tipo_pedido,
            p.data_pedido,
            p.valor_total_fechado,
            p.descricao_itens_servicos,
            p.prazo_entrega_acordado,
            p.contrato_url,
            p.projeto_referencia_url,
            p.status_pedido,
            l.nome_contato AS cliente_contato,
            l.empresa,
            COALESCE(l.empresa, l.nome_contato) AS cliente_nome,
            l.cpf_cnpj,
            l.telefone,
            l.email,
            l.cidade,
            l.estado,
            kf.id AS financeiro_id,
            kf.etapa_kanban AS financeiro_etapa,
            kf.status_pagamento,
            kf.liberado_para_producao,
            ka.id AS arquitetura_id,
            ka.etapa_kanban AS arquitetura_etapa,
            ka.requer_matriz_externa,
            ka.matriz_recebida_check,
            kp.id AS producao_id,
            kp.etapa_kanban AS producao_etapa,
            kp.tipo_producao
        FROM pedidos p
        LEFT JOIN leads l ON l.id = p.lead_id
        LEFT JOIN kanban_financeiro kf ON kf.pedido_id = p.id
        LEFT JOIN kanban_arquitetura ka ON ka.pedido_id = p.id
        LEFT JOIN kanban_producao kp ON kp.pedido_id = p.id
    `;
}

const PedidoModel = {
    listarPedidos: async (filtros = {}) => {
        const { where, params } = montarFiltrosPedidos(filtros);
        const [rows] = await db.query(
            `${selectPedidoCompleto()} ${where} ORDER BY p.data_pedido DESC`,
            params
        );
        return rows;
    },

    buscarPedidoPorId: async (id) => {
        const [rows] = await db.query('SELECT * FROM pedidos WHERE id = ?', [id]);
        return rows[0];
    },

    buscarPedidoPorNumero: async (numeroPedido) => {
        const [rows] = await db.query('SELECT * FROM pedidos WHERE numero_pedido = ?', [numeroPedido]);
        return rows[0];
    },

    buscarPedidoCompletoPorId: async (id) => {
        const [rows] = await db.query(`${selectPedidoCompleto()} WHERE p.id = ?`, [id]);
        return rows[0];
    },

    criarPedido: async (dados, connection = db) => {
        const query = `
            INSERT INTO pedidos (
                crm_id,
                lead_id,
                numero_pedido,
                tipo_pedido,
                valor_total_fechado,
                descricao_itens_servicos,
                prazo_entrega_acordado,
                contrato_url,
                projeto_referencia_url,
                status_pedido
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Em Processamento')
        `;
        const params = [
            dados.crm_id || null,
            dados.lead_id,
            dados.numero_pedido,
            dados.tipo_pedido,
            dados.valor_total_fechado || 0,
            dados.descricao_itens_servicos || null,
            dados.prazo_entrega_acordado || null,
            dados.contrato_url || null,
            dados.projeto_referencia_url || null
        ];
        const [result] = await connection.query(query, params);
        return result;
    },

    atualizarPedido: async (id, dados) => {
        const campos = CAMPOS_ATUALIZAVEIS.filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo));
        if (campos.length === 0) return { affectedRows: 0 };

        const sets = campos.map((campo) => `${campo} = ?`).join(', ');
        const params = campos.map((campo) => dados[campo]);
        params.push(id);
        const [result] = await db.query(`UPDATE pedidos SET ${sets} WHERE id = ?`, params);
        return result;
    },

    atualizarStatus: async (id, status, connection = db) => {
        const [result] = await connection.query('UPDATE pedidos SET status_pedido = ? WHERE id = ?', [status, id]);
        return result;
    },

    buscarFinanceiroPorPedidoId: async (pedidoId) => {
        const [rows] = await db.query('SELECT * FROM kanban_financeiro WHERE pedido_id = ?', [pedidoId]);
        return rows[0];
    },

    buscarArquiteturaPorPedidoId: async (pedidoId) => {
        const [rows] = await db.query('SELECT * FROM kanban_arquitetura WHERE pedido_id = ?', [pedidoId]);
        return rows[0];
    },

    buscarProducaoPorPedidoId: async (pedidoId) => {
        const [rows] = await db.query('SELECT * FROM kanban_producao WHERE pedido_id = ?', [pedidoId]);
        return rows[0];
    },

    criarCardFinanceiroParaPedido: async (dados, connection = db) => {
        const [result] = await connection.query(
            `INSERT INTO kanban_financeiro (
                pedido_id,
                valor_total_pedido,
                etapa_kanban,
                status_pagamento,
                liberado_para_producao
            ) VALUES (?, ?, 'Entrada', 'Pendente', FALSE)`,
            [dados.pedido_id, dados.valor_total_pedido || 0]
        );
        return result;
    },

    criarCardArquiteturaParaPedido: async (dados, connection = db) => {
        const [result] = await connection.query(
            `INSERT INTO kanban_arquitetura (
                pedido_id,
                etapa_kanban,
                requer_matriz_externa
            ) VALUES (?, 'Briefing', 1)`,
            [dados.pedido_id]
        );
        return result;
    },

    criarCardProducaoParaPedido: async (dados, connection = db) => {
        const [result] = await connection.query(
            `INSERT INTO kanban_producao (
                pedido_id,
                arquitetura_id,
                financeiro_id,
                etapa_kanban,
                tipo_producao,
                responsavel_producao_id,
                previsao_entrega_final
            ) VALUES (?, ?, ?, 'Aguardando Liberacao', ?, ?, ?)`,
            [
                dados.pedido_id,
                dados.arquitetura_id || null,
                dados.financeiro_id || null,
                dados.tipo_producao || 'Normal',
                dados.responsavel_producao_id || null,
                dados.previsao_entrega_final || null
            ]
        );
        return result;
    },

    marcarCardsCancelados: async (pedidoId, connection = db) => {
        await connection.query("UPDATE kanban_financeiro SET etapa_kanban = 'Cancelado' WHERE pedido_id = ?", [pedidoId]);
        await connection.query("UPDATE kanban_arquitetura SET etapa_kanban = 'Cancelado' WHERE pedido_id = ?", [pedidoId]);
        await connection.query("UPDATE kanban_producao SET etapa_kanban = 'Cancelado' WHERE pedido_id = ?", [pedidoId]);
    }
};

module.exports = PedidoModel;
