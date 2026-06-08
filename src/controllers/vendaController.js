const VendaService = require('../services/vendaService');
const { asyncHandler } = require('../utils/asyncHandler');

const VendaController = {
    listar: asyncHandler(async (req, res) => {
        const result = await VendaService.listarVendas();
        res.status(200).json(result);
    }),

    converter: asyncHandler(async (req, res) => {
        const { leadId, detalhesTecnicos } = req.body;
        const result = await VendaService.converterLeadParaVenda(leadId, detalhesTecnicos);
        res.status(201).json(result);
    })
};

module.exports = VendaController;
