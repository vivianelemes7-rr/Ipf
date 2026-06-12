const db = require('../config/database');

class VendaModel {
    static async criarDaLead(leadId, detalhesTecnicos) {
        const [result] = await db.query(
            'INSERT INTO vendas (lead_id, detalhes_arquitetura, status_venda) VALUES (?, ?, ?)',
            [leadId, detalhesTecnicos || null, 'Em Arquitetura']
        );
        return result;
    }

    static async listar() {
        const [rows] = await db.query(
            `SELECT v.*, l.nome_contato AS cliente_nome, l.email, l.telefone, l.empresa
             FROM vendas v
             JOIN leads l ON v.lead_id = l.id
             ORDER BY v.data_venda DESC`
        );
        return rows;
    }
}

module.exports = VendaModel;
