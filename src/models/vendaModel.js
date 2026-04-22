const db = require('../config/database');

const VendaModel = {
    criarDaLead: async (leadId, detalhesTecnicos) => {
        const query = 'INSERT INTO vendas (lead_id, detalhes_arquitetura, status_venda) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [leadId, detalhesTecnicos, 'Em Arquitetura']);
        return result;
    }
};

module.exports = VendaModel;

