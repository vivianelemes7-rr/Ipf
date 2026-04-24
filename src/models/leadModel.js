const db = require('../config/database');

const LeadModel = {
    criar: async (dados) => {
        const query = `
            INSERT INTO leads (nome_contato, empresa, cpf_cnpj, telefone, email, endereco_completo, origem)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        
        const [result] = await db.query(query, [
            dados.nome_contato, 
            dados.empresa || null, 
            dados.cpf_cnpj || null, 
            dados.telefone || null, 
            dados.email || null, 
            dados.endereco_completo || null, 
            dados.origem || 'Direto'
        ]);
        
        return result;
    }
};

module.exports = LeadModel;

