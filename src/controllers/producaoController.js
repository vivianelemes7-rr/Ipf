const ProducaoService = require('../services/producaoService');
const { asyncHandler } = require('../utils/asyncHandler');

const ProducaoController = {
    moverPedido: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await ProducaoService.moverParaProducao(id);
        res.status(200).json(resultado);
    }),

    listarFila: asyncHandler(async (req, res) => {
        const fila = await ProducaoService.listarFilaCompleta();
        res.status(200).json(fila);
    })
};

module.exports = ProducaoController;
