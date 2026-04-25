const CRMComercialModel = require("../models/crm_comercialModel");

class CRMComercialService {
    // Busca todos os cards do CRM
    static async getAllCards() {
        return await CRMComercialModel.findAll();
    }

    // Busca cards de um vendedor específico (respeitando a regra do funcionários)
    static async getCardsByVendedor(vendedorId) {
        return await CRMComercialModel.findByVendedor(vendedorId);
    }

    // Cria um novo card com validações iniciais
    static async createCard(dados) {
        // Se um número de pedido for enviado na criação, verifica se já existe
        if (dados.numero_pedido) {
            const existingPedido = await CRMComercialModel.findByNumeroPedido(dados.numero_pedido);
            if (existingPedido) {
                throw new Error("Este número de pedido já está vinculado a outro lead.");
            }
        }

        // Validação simples: um lead_id é obrigatório para iniciar no CRM
        if (!dados.lead_id) {
            throw new Error("O ID do Lead é obrigatório para iniciar um card no CRM.");
        }

        return await CRMComercialModel.create(dados);
    }

    // Atualiza o card e trata o erro de ID inexistente
    static async updateCard(id, dados) {
        const updatedRows = await CRMComercialModel.update(id, dados);
        if (updatedRows === 0) {
            throw new Error("Registro no CRM não encontrado.");
        }
        return updatedRows;
    }

    // Lógica de negócio para fechar venda (Ganho)
    static async finalizeWinningSale(id, numeroPedido) {
        if (!numeroPedido) {
            throw new Error("É necessário informar o número do pedido para finalizar a venda.");
        }

        // Verifica se esse número de pedido já foi usado em outro card
        const existingPedido = await CRMComercialModel.findByNumeroPedido(numeroPedido);
        if (existingPedido && existingPedido.id !== parseInt(id)) {
            throw new Error("Este número de pedido já foi utilizado em outra negociação.");
        }

        const updatedRows = await CRMComercialModel.markAsWon(id, numeroPedido);
        if (updatedRows === 0) {
            throw new Error("Não foi possível finalizar a venda. Registro não encontrado.");
        }
        return updatedRows;
    }

    // Lógica para marcar como perdido
    static async finalizeLostSale(id, motivo) {
        if (!motivo || motivo.trim() === "") {
            throw new Error("É necessário informar o motivo da perda.");
        }

        const updatedRows = await CRMComercialModel.markAsLost(id, motivo);
        if (updatedRows === 0) {
            throw new Error("Registro não encontrado.");
        }
        return updatedRows;
    }

    // Deleta o card
    static async deleteCard(id) {
        const deletedRows = await CRMComercialModel.delete(id);
        if (deletedRows === 0) {
            throw new Error("Registro no CRM não encontrado.");
        }
        return deletedRows;
    }
}

module.exports = CRMComercialService;