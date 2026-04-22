const VendaService = require('../services/vendaService');

const VendaController = {
    converter: async (req, res, next) => {
        try {
            const { leadId, detalhesTecnicos } = req.body;
            const resultado = await VendaService.converterLeadParaVenda(leadId, detalhesTecnicos);
            res.status(201).json(resultado);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = VendaController;

