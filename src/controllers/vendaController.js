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
    },

    listar: async (req, res, next) => {
        try {
            const vendas = await VendaService.listarVendas();
            res.status(200).json(vendas);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = VendaController;
