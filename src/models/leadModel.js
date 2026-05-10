const db = require('../config/database');

const LeadModel = {
    criar: async (dados) => {
        const nomeFinal = dados.lead_name || dados.nome_contato;
        const telefoneFinal = dados.phone || dados.telefone;
        const documentoFinal = dados.document || dados.cpf_cnpj;

        const query = `
            INSERT INTO leads (nome_contato, empresa, cpf_cnpj, telefone, email, endereco_completo, origem)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const [result] = await db.query(query, [
            nomeFinal,
            dados.empresa || null,
            documentoFinal,
            telefoneFinal,
            dados.email || null,
            dados.endereco_completo || null,
            dados.origem || 'Direto'
        ]);

        return result;
    },

    listarTodos: async () => {
        const query = `
            SELECT 
                id, 
                nome_contato, 
                nome_contato AS lead_name, 
                empresa, 
                cpf_cnpj, 
                cpf_cnpj AS document,
                telefone, 
                telefone AS phone,
                email, 
                status_lead, 
                status_lead AS status 
            FROM leads`;

        const [linhas] = await db.query(query);
        return linhas;
    }
};

module.exports = LeadModel;
