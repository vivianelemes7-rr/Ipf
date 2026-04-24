const LeadModel = require('../models/leadModel');

const LeadService = {
    processarNovoLead: async (dadosLead) => {
        // Validação de campos obrigatórios
        if (!dadosLead.nome_contato) {
            throw new Error('O nome do contato é obrigatório.');
        }
        
        if (!dadosLead.telefone && !dadosLead.email) {
            throw new Error('É necessário fornecer ao menos um meio de contato (celular/WhatsApp ou e-mail).');
        }

        // Se estiver tudo ok, chama o model
        return await LeadModel.criar(dadosLead);
    }
};

module.exports = LeadService;

