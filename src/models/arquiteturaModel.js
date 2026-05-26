const conexao = require('../config/database');

const ArquiteturaModel = {
    async listarFila() {
        const query = `
            SELECT p.id, l.nome_contato AS cliente_nome, 
                   ka.etapa_kanban, ka.prioridade,
                   ka.data_entrega_prevista, ka.ultima_movimentacao
            FROM pedidos p
            JOIN kanban_arquitetura ka ON p.id = ka.pedido_id
            LEFT JOIN leads l ON p.lead_id = l.id
            ORDER BY ka.prioridade ASC, p.id ASC`;
        const [linhas] = await conexao.query(query);
        return linhas;
    },

    async buscarPorPedido(pedidoId) {
        const query = `
            SELECT p.id, p.tipo_pedido, l.nome_contato AS cliente_nome,
                   ka.etapa_kanban, ka.requer_matriz_externa,
                   ka.matriz_recebida_check, ka.prioridade,
                   ka.data_entrega_prevista, ka.ultima_movimentacao
            FROM pedidos p
            JOIN kanban_arquitetura ka ON p.id = ka.pedido_id
            LEFT JOIN leads l ON p.lead_id = l.id
            WHERE p.id = ?`;
        const [linhas] = await conexao.query(query, [pedidoId]);
        return linhas[0] || null;
    },

    async atualizarEtapa(pedidoId, novaEtapa) {
        const etapasPermitidas = [
            'aguardando', 'em_desenho', 'producao_matriz',
            'fup', 'matriz_pronta', 'conferencia_matriz', 'producao'
        ];

        if (!etapasPermitidas.includes(novaEtapa)) {
            throw new Error(`Etapa '${novaEtapa}' nao e permitida.`);
        }

        const query = `
            UPDATE kanban_arquitetura 
            SET etapa_kanban = ?, ultima_movimentacao = NOW()
            WHERE pedido_id = ?`;
        const [res] = await conexao.query(query, [novaEtapa, pedidoId]);
        return res.affectedRows;
    },

    async confirmarRecebimentoMatriz(pedidoId) {
        const query = `
            UPDATE kanban_arquitetura
            SET matriz_recebida_check = TRUE,
                etapa_kanban = 'producao',
                ultima_movimentacao = NOW()
            WHERE pedido_id = ?`;
        const [res] = await conexao.query(query, [pedidoId]);
        return res.affectedRows;
    }
};

module.exports = ArquiteturaModel;
