const VendaService = require('../services/vendaService');
const { asyncHandler } = require('../utils/asyncHandler');

const VendaController = {
    converter: asyncHandler(async (req, res) => {
        const { leadId, detalhesTecnicos } = req.body;
        const resultado = await VendaService.converterLeadParaVenda(leadId, detalhesTecnicos);
        res.status(201).json(resultado);
    }),

    listar: asyncHandler(async (req, res) => {
        const vendas = await VendaService.listarVendas();
        res.status(200).json(vendas);
    })
};

module.exports = VendaController;
