const PedidoService = require('../services/pedidoService');
const { asyncHandler } = require('../utils/asyncHandler');

const PedidoController = {
    listar: asyncHandler(async (req, res) => {
        const pedidos = await PedidoService.listarPedidos(req.query);
        res.status(200).json(pedidos);
    }),

    buscarPorId: asyncHandler(async (req, res) => {
        const pedido = await PedidoService.buscarPedido(req.params.id);
        res.status(200).json(pedido);
    }),

    criar: asyncHandler(async (req, res) => {
        const resultado = await PedidoService.criarPedido(req.body);
        res.status(201).json(resultado);
    }),

    atualizar: asyncHandler(async (req, res) => {
        const pedido = await PedidoService.atualizarPedido(req.params.id, req.body);
        res.status(200).json(pedido);
    }),

    avancar: asyncHandler(async (req, res) => {
        const pedido = await PedidoService.avancarPedido(req.params.id);
        res.status(200).json(pedido);
    }),

    cancelar: asyncHandler(async (req, res) => {
        const pedido = await PedidoService.cancelarPedido(req.params.id);
        res.status(200).json(pedido);
    }),

    finalizar: asyncHandler(async (req, res) => {
        const pedido = await PedidoService.finalizarPedido(req.params.id);
        res.status(200).json(pedido);
    })
};

module.exports = PedidoController;
