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
        if (!dadosLead.telefone && !dadosLead.email && dadosLead.origem !== 'Kanban') {
            throw AppError.badRequest('É necessário fornecer ao menos um meio de contato.');
        }
        return await LeadModel.criar(dadosLead);
    }
};

module.exports = LeadService;
