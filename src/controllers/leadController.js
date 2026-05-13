const LeadService = require('../services/leadService');

const LeadController = {
    listar: async (req, res) => {
        try {
            const leads = await LeadService.listarLeads();
            res.status(200).json(leads);
        } catch (error) {
            res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });
        }
    },
    criar: async (req, res) => {
        try {
            const resultado = await LeadService.processarNovoLead(req.body);
            res.status(201).json({
                sucesso: true,
                id: resultado.insertId,
                mensagem: "Lead cadastrado com sucesso!"
            });
        } catch (error) {
            res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });
        }
    }
};

module.exports = LeadController;

