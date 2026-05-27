const ProducaoService = require('../services/producaoService');
const { asyncHandler } = require('../utils/asyncHandler');

const ProducaoController = {
    moverPedido: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await ProducaoService.moverParaProducao(id, req.body || {});
        res.status(resultado.criado ? 201 : 200).json(resultado);
    }),

    listarFila: asyncHandler(async (req, res) => {
        const fila = await ProducaoService.listarFilaCompleta(req.query);
        res.status(200).json(fila);
    }),

    buscarPorId: asyncHandler(async (req, res) => {
        const card = await ProducaoService.buscarCard(req.params.id);
        res.status(200).json(card);
    }),

    atualizarEtapa: asyncHandler(async (req, res) => {
        const etapa = req.body.etapa_kanban || req.body.etapa;
        const card = await ProducaoService.atualizarEtapa(req.params.id, etapa, req.usuario);
        res.status(200).json(card);
    }),

    atualizarResponsavel: asyncHandler(async (req, res) => {
        const card = await ProducaoService.atualizarResponsavel(req.params.id, req.body.responsavel_producao_id);
        res.status(200).json(card);
    }),

    atualizarMatriz: asyncHandler(async (req, res) => {
        const card = await ProducaoService.atualizarMatriz(req.params.id, req.body);
        res.status(200).json(card);
    }),

    atualizarDatas: asyncHandler(async (req, res) => {
        const card = await ProducaoService.atualizarDatas(req.params.id, req.body);
        res.status(200).json(card);
    }),

    remover: asyncHandler(async (req, res) => {
        const resultado = await ProducaoService.removerCard(req.params.id);
        res.status(200).json(resultado);
    })
};

module.exports = ProducaoController;
