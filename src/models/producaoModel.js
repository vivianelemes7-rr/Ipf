const conexao = require('../config/database');

const TABELAS_PERMITIDAS = ['kanban_producao', 'kanban_arquitetura'];

const ProducaoModel = {
    async atualizarStatusFila(tabela, pedidoId, novoStatus) {
        if (!TABELAS_PERMITIDAS.includes(tabela)) {
            throw new Error(`Acesso negado: Tabela '${tabela}' nao e permitida para atualizacao.`);
        }

        const query = `UPDATE ${tabela} SET etapa_kanban = ? WHERE pedido_id = ?`;
        const [res] = await conexao.query(query, [novoStatus, pedidoId]);
        return res.affectedRows;
    },

    async listarFilaProducao() {
        const query = `
            SELECT p.id, l.nome_contato AS cliente_nome, kp.etapa_kanban
            FROM pedidos p
            JOIN kanban_producao kp ON p.id = kp.pedido_id
            LEFT JOIN leads l ON p.lead_id = l.id
            ORDER BY p.id ASC`;
        const [linhas] = await conexao.query(query);
        return linhas;
    }
};

module.exports = ProducaoModel;
