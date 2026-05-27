const AppError = require('../utils/AppError');
const CRMComercialModel = require("../models/crm_comercialModel");
const PedidoModel = require("../models/pedidoModel");
const VendaModel = require("../models/vendaModel");
const PedidoService = require('./pedidoService');

class CRMComercialService {
    static async getAllCards() {
        return await CRMComercialModel.findAll();
    }

    static async getCardsByVendedor(vendedorId) {
        return await CRMComercialModel.findByVendedor(vendedorId);
    }

    static async createCard(dados) {
        if (dados.numero_pedido) {
            const existingPedido = await CRMComercialModel.findByNumeroPedido(dados.numero_pedido);
            if (existingPedido) {
                throw AppError.conflict('Este número de pedido já está vinculado a outro lead.');
            }
        }

        if (!dados.lead_id) {
            throw AppError.badRequest('O ID do Lead é obrigatório para iniciar um card no CRM.');
        }

        return await CRMComercialModel.create(dados);
    }

    // Atualização de card (ex: mover etapa, atualizar valor, etc.)
    static async updateCard(id, dados) {
        return await CRMComercialModel.update(id, dados);
    }

    static async finalizeWinningSale(id, numero_pedido, tipo_pedido = 'Normal') {
        if (!numero_pedido) {
            throw AppError.badRequest('É necessário informar o número do pedido para finalizar a venda.');
        }
        PedidoService.validarTipoPedido(tipo_pedido);

        const existingPedido = await CRMComercialModel.findByNumeroPedido(numero_pedido);
        if (existingPedido && existingPedido.id !== parseInt(id)) {
            throw AppError.conflict('Este número de pedido já foi utilizado em outra negociação.');
        }

        const pedidoExistente = await PedidoModel.buscarPedidoPorNumero(numero_pedido);
        if (pedidoExistente) {
            throw AppError.conflict('Este número de pedido já existe em pedidos.');
        }

        const cardAntesDoGanho = await CRMComercialModel.findById(id);
        if (!cardAntesDoGanho) {
            throw AppError.notFound('Card do CRM não encontrado.');
        }

        // 1. Marca como Ganho no CRM
        const updatedRows = await CRMComercialModel.markAsWon(id, numero_pedido);

        if (updatedRows > 0) {
            // 2. Mantém compatibilidade com o fluxo antigo de vendas
            await VendaModel.criarDaLead(cardAntesDoGanho.lead_id, cardAntesDoGanho.observacoes_venda || 'Pedido gerado via CRM');

            // 3. Cria o pedido real e inicia o fluxo financeiro
            await PedidoService.criarPedido({
                crm_id: Number(id),
                lead_id: cardAntesDoGanho.lead_id,
                numero_pedido,
                tipo_pedido,
                valor_total_fechado: cardAntesDoGanho.valor_estimado || 0,
                descricao_itens_servicos: cardAntesDoGanho.observacoes_venda || 'Pedido gerado via CRM',
                prazo_entrega_acordado: null,
                contrato_url: null,
                projeto_referencia_url: cardAntesDoGanho.proposta_url || null
            });
        }

        return updatedRows;
    }

    static async finalizeLostSale(id, motivo) {
        if (!motivo || motivo.trim() === "") {
            throw AppError.badRequest('É necessário informar o motivo da perda.');
        }
        return await CRMComercialModel.markAsLost(id, motivo);
    }

    static async updateCard(id, dados) {
        if (!id) {
            throw AppError.badRequest('O ID do card é obrigatório para atualização.');
        }

        return await CRMComercialModel.update(id, dados);
    }

    static async deleteCard(id) {
        return await CRMComercialModel.delete(id);
    }
}

module.exports = CRMComercialService;
