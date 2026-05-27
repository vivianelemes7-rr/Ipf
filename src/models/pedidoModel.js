const conexao = require('../config/database');

const PedidoModel = {
    async findPendingBilling(diasLimite) {
        const query = `
            SELECT p.id, p.lead_id, p.numero_pedido, p.status_pedido,
            p.data_pedido, p.valor_total_fechado
            FROM pedidos p
            WHERE p.status_pedido NOT IN ('Faturado', 'Cancelado', 'Concluido')
            AND p.data_pedido < DATE_SUB(NOW(), INTERVAL ? DAY)
            ORDER BY p.data_pedido ASC`;
        const [rows] = await conexao.query(query, [diasLimite]);
        return rows;
    },

    async buscarPorId(id) {
        const [rows] = await conexao.query(
            'SELECT * FROM pedidos WHERE id = ?', [id]
        );
        return rows[0] || null;
    },

    async listar() {
        const [rows] = await conexao.query(
            'SELECT * FROM pedidos ORDER BY data_pedido DESC'
        );
        return rows;
    }
};

module.exports = PedidoModel;