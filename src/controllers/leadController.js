const LeadService = require('../services/leadService');
const { asyncHandler } = require('../utils/asyncHandler');

const LeadController = {
    listar: asyncHandler(async (req, res) => {
        const leads = await LeadService.listarLeads();
        res.status(200).json(leads);
    }),

    criar: asyncHandler(async (req, res) => {
        const resultado = await LeadService.processarNovoLead(req.body);
        res.status(201).json({
            sucesso: true,
            id: resultado.insertId,
            mensagem: 'Lead cadastrado com sucesso!'
        });
    })
};

module.exports = LeadController;
