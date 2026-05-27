const GerenciaService = require('../services/gerenciaService');
const { asyncHandler } = require('../utils/asyncHandler');

const GerenciaController = {
    healthCheck: asyncHandler(async (req, res) => {
        res.status(200).json({ sucesso: true, status: 'OK', mensagem: 'Módulo de gerência operando normalmente.' });
    }),

    painel: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.obterPainel(req.query);
        res.status(200).json({ sucesso: true, dados });
    }),

    indicadores: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.obterIndicadores();
        res.status(200).json({ sucesso: true, dados });
    }),

    pedidosParados: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.listarPedidosParados(req.query.dias_limite || 7);
        res.status(200).json({ sucesso: true, dados });
    }),

    pedidosAtrasados: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.listarPedidosAtrasados();
        res.status(200).json({ sucesso: true, dados });
    }),

    vendedores: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.visaoPorVendedor();
        res.status(200).json({ sucesso: true, dados });
    }),

    responsaveis: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.visaoPorResponsavel();
        res.status(200).json({ sucesso: true, dados });
    }),

    kanban: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.listarKanban(req.query);
        res.status(200).json({ sucesso: true, dados });
    }),

    buscarCardKanban: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.buscarCardGerencial(req.params.id);
        res.status(200).json({ sucesso: true, dados });
    }),

    criarCardKanban: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.criarCardGerencial(req.body, req.usuario);
        res.status(201).json({ sucesso: true, dados });
    }),

    atualizarCardKanban: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.atualizarCardGerencial(req.params.id, req.body, req.usuario);
        res.status(200).json({ sucesso: true, dados });
    }),

    moverCardKanban: asyncHandler(async (req, res) => {
        const etapa = req.body.etapa_kanban || req.body.etapa;
        const dados = await GerenciaService.moverCardGerencial(req.params.id, etapa, req.usuario);
        res.status(200).json({ sucesso: true, dados });
    }),

    deletarCardKanban: asyncHandler(async (req, res) => {
        const dados = await GerenciaService.deletarCardGerencial(req.params.id);
        res.status(200).json({ sucesso: true, dados });
    })
};

module.exports = GerenciaController;
