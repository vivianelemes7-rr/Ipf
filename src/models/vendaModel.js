const conexao = require('../config/database');

const VendaModel = {
    async criarDaLead(leadId, detalhesTecnicos) {
        const query = 'INSERT INTO vendas (lead_id, detalhes_arquitetura, status_venda) VALUES (?, ?, ?)';
        const [res] = await conexao.query(query, [leadId, detalhesTecnicos, 'Em Arquitetura']);
        return { insertId: res.insertId };
    },

    async listar() {
        const [linhas] = await conexao.query('SELECT * FROM vendas ORDER BY id');
        return linhas;
    }
};

module.exports = VendaModel;
