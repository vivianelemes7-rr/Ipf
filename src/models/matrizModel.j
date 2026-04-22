const db = require('../config/database');

const MatrizModel = {
    // Busca informações de matriz de um pedido específico
    getMatrizStatus: async (pedidoId) => {
        const [rows] = await db.query(
            `SELECT tipo_pedido, requer_matriz_externa, matriz_recebida_check 
             FROM pedidos p
             JOIN kanban_arquitetura a ON p.id = a.pedido_id
             WHERE p.id = ?`, [pedidoId]
        );
        return rows[0];
    }
};

module.exports = MatrizModel;

