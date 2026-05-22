const CRMFinanceiroModel = require("../models/crm_financeiroModel");

// Importar para integração com Produção (Gatilho de Liberação)
const ProducaoModel = require("../models/producaoModel"); 

class CRMFinanceiroService {
    // Busca todos os cards do financeiro para o painel geral
    static async getAllCards() {
        return await CRMFinanceiroModel.findAll();
    }

    // Busca os cards filtrados pelo responsável financeiro logado
    static async getCardsByResponsavel(responsavelFinId) {
        if (!responsavelFinId) {
            throw new Error("O ID do responsável financeiro é obrigatório para filtrar.");
        }
        return await CRMFinanceiroModel.findByResponsavelFin(responsavelFinId);
    }

    // Busca cards por colunas específicas (Gerar Ordem de Compra/pagamento, Notificação de Liberação, Emissão de Nota Fiscal, etc.)
    static async getCardsByEtapa(etapaKanban) {
        if (!etapaKanban) {
            throw new Error("A etapa do Kanban precisa ser informada.");
        }
        return await CRMFinanceiroModel.findByEtapa(etapaKanban);
    }

    // Cria a entrada do pedido no Kanban Financeiro
    static async createCard(dados) {
        if (!dados.pedido_id) {
            throw new Error("O ID do Pedido é obrigatório para iniciar o fluxo financeiro.");
        }

        // Regra de Negócio: Evita duplicar o mesmo pedido dentro do fluxo do financeiro
        const cardsExistentes = await CRMFinanceiroModel.findAll();
        const pedidoJaExiste = cardsExistentes.some(card => card.pedido_id === parseInt(dados.pedido_id));
        
        if (pedidoJaExiste) {
            throw new Error("Este pedido já possui um card ativo no fluxo financeiro.");
        }

        return await CRMFinanceiroModel.create(dados);
    }

    // Atualização comum do card (Mudar de coluna manualmente, trocar responsável, etc.)
    static async updateCard(id, dados) {
        if (!id) {
            throw new Error("O ID do registro financeiro é obrigatório para atualização.");
        }
        return await CRMFinanceiroModel.update(id, dados);
    }

    // GATILHO: Liberar para Produção e Notificar Sistemas Paralelos
    static async executeLiberacaoProducao(id) {
        if (!id) {
            throw new Error("O ID do registro é obrigatório para executar a liberação.");
        }

        // 1. Executa a transação no Model (Aprova o financeiro e muda status_pedido para 'Produção')
        const updatedRows = await CRMFinanceiroModel.liberarParaProducao(id);

        if (updatedRows === 0) {
            throw new Error("Não foi possível processar a liberação. Registro não encontrado.");
        }

        // 2. Gatilho automático de envio de pedido para Produção
        const cardFinanceiro = await CRMFinanceiroModel.findById(id);
        await ProducaoModel.iniciarFilaProducao({
            pedido_id: cardFinanceiro.pedido_id,
            detalhes: 'Liberado pelo setor financeiro automaticamente.'
        });
        

        return updatedRows;
    }

    // Atualiza o status de pagamento (Ex: 'Quitado', 'Aguardando Liberação')
    static async changePaymentStatus(id, status) {
        if (!id || !status || status.trim() === "") {
            throw new Error("ID e Status de pagamento são obrigatórios.");
        }
        return await CRMFinanceiroModel.atualizarStatusPagamento(id, status);
    }

    // Remove o card do financeiro
    static async deleteCard(id) {
        if (!id) {
            throw new Error("O ID é obrigatório para exclusão.");
        }
        return await CRMFinanceiroModel.delete(id);
    }
}

module.exports = CRMFinanceiroService;