const db = require('../config/database');

const ProducaoModel = {
    // Função para mover o pedido entre as etapas (Arquitetura -> Produção)
    atualizarStatusFila: async (tabela, pedidoId, novoStatus) => {
        const query = `UPDATE ${tabela} SET status_etapa = ? WHERE pedido_id = ?`;
        const [result] = await db.query(query, [novoStatus, pedidoId]);
        return result;
    },

    // Busca a lista de pedidos que estão na fábrica
    listarFilaProducao: async () => {
        const query = `
            SELECT p.id, p.cliente_nome, kp.status_etapa 
            FROM pedidos p
            JOIN kanban_producao kp ON p.id = kp.pedido_id
            ORDER BY p.id ASC`;
        const [rows] = await db.query(query);
        return rows;
    }
};

module.exports = ProducaoModel;

