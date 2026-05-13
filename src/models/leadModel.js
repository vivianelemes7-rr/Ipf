const db = require('../config/database');

const LeadModel = {
    listar: async () => {
        const [rows] = await db.query('SELECT * FROM leads');
        return rows;
    },
    criar: async (dados) => {
        const { nome_contato, email, telefone, cidade, estado, desde, pedidos, valor_total, nivel } = dados;
        const sql = 'INSERT INTO leads (nome_contato, email, telefone, cidade, estado, desde, pedidos, valor_total, nivel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [nome_contato, email, telefone, cidade, estado, desde, pedidos, valor_total, nivel]);
        return result;
    }
};

module.exports = LeadModel;

