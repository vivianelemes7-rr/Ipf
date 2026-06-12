const ArquiteturaService = require('../services/arquiteturaService');
const { asyncHandler } = require('../utils/asyncHandler');

const ArquiteturaController = {
    listarFila: asyncHandler(async (req, res) => {
        const resultado = await ArquiteturaService.listarFila();
        res.status(200).json({ data: resultado });
    }),

    buscarPorPedido: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await ArquiteturaService.buscarPorPedido(id);
        res.status(200).json(resultado);
    }),

    atualizarEtapa: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { etapa } = req.body;

        if (!etapa) {
            return res.status(400).json({ message: 'O campo etapa é obrigatório' });
        }

        const resultado = await ArquiteturaService.atualizarEtapa(id, etapa);
        res.status(200).json(resultado);
    }),

    confirmarRecebimentoMatriz: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await ArquiteturaService.confirmarRecebimentoMatriz(id);
        res.status(200).json(resultado);
    })
};

module.exports = ArquiteturaController;
