const AppError = require('../utils/AppError');
const ArquiteturaModel = require('../models/arquiteturaModel');

const ArquiteturaService = {
    async listarFila() {
        return await ArquiteturaModel.listarFila();
    },

    async buscarPorPedido(pedidoId) {
        const dados = await ArquiteturaModel.buscarPorPedido(pedidoId);
        if (!dados) throw AppError.notFound('Pedido não encontrado na fila de arquitetura');
        return dados;
    },

    async atualizarEtapa(pedidoId, novaEtapa) {
        const dados = await ArquiteturaModel.buscarPorPedido(pedidoId);
        if (!dados) throw AppError.notFound('Pedido não encontrado');

        const afetados = await ArquiteturaModel.atualizarEtapa(pedidoId, novaEtapa);
        if (afetados === 0) throw AppError.internal('Não foi possível atualizar a etapa');

        return {
            sucesso: true,
            mensagem: `Pedido ${pedidoId} movido para '${novaEtapa}'`
        };
    },

    async confirmarRecebimentoMatriz(pedidoId) {
        const dados = await ArquiteturaModel.buscarPorPedido(pedidoId);
        if (!dados) throw AppError.notFound('Pedido não encontrado');

        if (!dados.requer_matriz_externa) {
            throw AppError.badRequest('Este pedido não requer matriz externa');
        }

        if (dados.matriz_recebida_check) {
            throw AppError.badRequest('Matriz já foi confirmada anteriormente');
        }

        const afetados = await ArquiteturaModel.confirmarRecebimentoMatriz(pedidoId);
        if (afetados === 0) throw AppError.internal('Não foi possível confirmar recebimento');

        return {
            sucesso: true,
            mensagem: `Matriz do pedido ${pedidoId} confirmada. Card movido para Produção.`
        };
    }
};

module.exports = ArquiteturaService;
