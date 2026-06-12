const AppError = require('../utils/AppError');
const CRMComercialModel = require("../models/crm_comercialModel");
const PedidoModel = require("../models/pedidoModel");
const PedidoService = require('./pedidoService');

const ETAPAS_VENDAS = CRMComercialModel.ETAPAS_VENDAS;

function normalizarEtapa(etapa) {
    const valor = String(etapa || '').trim();
    if (valor === 'Orçamento') return 'Orcamento';
    return valor;
}

class CRMComercialService {
    static validarEtapa(etapa) {
        const etapaNormalizada = normalizarEtapa(etapa);
        if (!ETAPAS_VENDAS.includes(etapaNormalizada)) {
            throw AppError.badRequest(`Etapa comercial inválida: ${etapa || ''}.`);
        }
        return etapaNormalizada;
    }

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

        if (dados.etapa_kanban) {
            dados.etapa_kanban = CRMComercialService.validarEtapa(dados.etapa_kanban);
        }

        return await CRMComercialModel.create(dados);
    }

    // Atualização de card (ex: mover etapa, atualizar valor, etc.)
    static async updateCard(id, dados) {
        if (!id) {
            throw AppError.badRequest('O ID do card é obrigatório para atualização.');
        }
        if (dados.etapa_kanban) {
            dados.etapa_kanban = CRMComercialService.validarEtapa(dados.etapa_kanban);
        }
        return await CRMComercialModel.update(id, dados);
    }

    static async moverEtapa(id, etapa) {
        if (!id) throw AppError.badRequest('O ID do card é obrigatório.');
        const etapaNormalizada = CRMComercialService.validarEtapa(etapa);

        const card = await CRMComercialModel.findById(id);
        if (!card) throw AppError.notFound('Card do CRM não encontrado.');
        if (card.status_final !== 'Em Aberto') {
            throw AppError.badRequest('Somente cards em aberto podem ser movidos.');
        }

        await CRMComercialModel.moveStage(id, etapaNormalizada);
        return await CRMComercialModel.findById(id);
    }

    static async anexarProposta(id, propostaUrl) {
        if (!propostaUrl) throw AppError.badRequest('proposta_url é obrigatório.');
        const card = await CRMComercialModel.findById(id);
        if (!card) throw AppError.notFound('Card do CRM não encontrado.');

        await CRMComercialModel.anexarProposta(id, propostaUrl);
        return await CRMComercialModel.findById(id);
    }

    static async marcarPropostaEnviada(id) {
        const card = await CRMComercialModel.findById(id);
        if (!card) throw AppError.notFound('Card do CRM não encontrado.');
        if (!card.proposta_url) throw AppError.badRequest('Anexe uma proposta antes de marcar como enviada.');

        await CRMComercialModel.marcarPropostaEnviada(id);
        return await CRMComercialModel.findById(id);
    }

    static async finalizeWinningSale(id, numero_pedido, tipo_pedido = 'Normal') {
        if (!numero_pedido) {
            throw AppError.badRequest('É necessário informar o número do pedido para finalizar a venda.');
        }
        PedidoService.validarTipoPedido(tipo_pedido);

        const cardAntesDoGanho = await CRMComercialModel.findById(id);
        if (!cardAntesDoGanho) {
            throw AppError.notFound('Card do CRM não encontrado.');
        }

        const pedidoJaGerado = await PedidoModel.buscarPedidoPorCrmId(id);
        if (cardAntesDoGanho.pedido_gerado && pedidoJaGerado) {
            return { pedido_id: pedidoJaGerado.id, criado: false };
        }

        const existingPedido = await CRMComercialModel.findByNumeroPedido(numero_pedido);
        if (existingPedido && existingPedido.id !== parseInt(id)) {
            throw AppError.conflict('Este número de pedido já foi utilizado em outra negociação.');
        }

        const pedidoExistente = await PedidoModel.buscarPedidoPorNumero(numero_pedido);
        if (pedidoExistente) {
            throw AppError.conflict('Este número de pedido já existe em pedidos.');
        }

        // 1. Marca como Ganho no CRM
        const updatedRows = await CRMComercialModel.markAsWon(id, numero_pedido);

        if (updatedRows > 0) {

            // 3. Cria o pedido real e inicia o fluxo financeiro
            const pedidoCriado = await PedidoService.criarPedido({
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

            return { ...pedidoCriado, criado: true };
        }

        return { atualizado: updatedRows, criado: false };
    }

    static async finalizeLostSale(id, motivo) {
        if (!motivo || motivo.trim() === "") {
            throw AppError.badRequest('É necessário informar o motivo da perda.');
        }
        return await CRMComercialModel.markAsLost(id, motivo);
    }

    static async deleteCard(id) {
        return await CRMComercialModel.delete(id);
    }
}

module.exports = CRMComercialService;
