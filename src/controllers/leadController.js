const LeadService = require('../services/leadService');

const LeadController = {
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

