const AppError = require('../utils/AppError');
const LeadModel = require('../models/leadModel');

const LeadService = {
    listarLeads: async () => {
        return await LeadModel.listar();
    },

    processarNovoLead: async (dadosLead) => {
        if (!dadosLead.nome_contato) {
            throw AppError.badRequest('O nome do contato é obrigatório.');
        }
<<<<<<< HEAD
        if (!dadosLead.telefone && !dadosLead.email && dadosLead.origem !== 'Kanban') {
=======
        if (!dadosLead.telefone && !dadosLead.email) {
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
            throw AppError.badRequest('É necessário fornecer ao menos um meio de contato.');
        }
        return await LeadModel.criar(dadosLead);
    }
};

module.exports = LeadService;
