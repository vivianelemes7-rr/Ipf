const CRMComercialModel = require("../models/crm_comercialModel");
const VendaModel = require("../models/vendaModel");
const ProducaoModel = require("../models/producaoModel");

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
                throw new Error("Este número de pedido já está vinculado a outro lead.");
            }
        }

        if (!dados.lead_id) {
            throw new Error("O ID do Lead é obrigatório para iniciar um card no CRM.");
        }

        return await CRMComercialModel.create(dados);
    }

    // Atualização de card (ex: mover etapa, atualizar valor, etc.)
    static async updateCard(id, dados) {
        return await CRMComercialModel.update(id, dados);
    }

    static async finalizeWinningSale(id, numero_pedido) {
        if (!numero_pedido) {
            throw new Error("É necessário informar o número do pedido para finalizar a venda.");
        }

        const existingPedido = await CRMComercialModel.findByNumeroPedido(numero_pedido);
        if (existingPedido && existingPedido.id !== parseInt(id)) {
            throw new Error("Este número de pedido já foi utilizado em outra negociação.");
        }

        // 1. Marca como Ganho no CRM
        const updatedRows = await CRMComercialModel.markAsWon(id, numero_pedido);
        
        if (updatedRows > 0) {
            // 2. Busca os dados do card para transferir para a Venda
            const card = await CRMComercialModel.findById(id);
            
            // 3. CRIAÇÃO DA VENDA (Conexão com setor de Projetos/Arquitetura)
            await VendaModel.criarDaLead(card.lead_id, card.observacoes_venda || 'Pedido gerado via CRM');
            
        }

        return updatedRows;
    }

    static async finalizeLostSale(id, motivo) {
        if (!motivo || motivo.trim() === "") {
            throw new Error("É necessário informar o motivo da perda.");
        }
        return await CRMComercialModel.markAsLost(id, motivo);
    }

    static async deleteCard(id) {
        return await CRMComercialModel.delete(id);
    }
}

module.exports = CRMComercialService;
