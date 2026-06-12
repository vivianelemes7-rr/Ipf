const CRMFinanceiroService = require('../services/crm_financeiroService');

class CRMFinanceiroController {
    // Lista todos os cards do financeiro (Permite filtros opcionais por responsável ou por etapa/coluna)
    static async getAll(req, res) {
        try {
            const { responsavel_fin_id, etapa_kanban } = req.query;
            let cards;

            if (responsavel_fin_id) {
                cards = await CRMFinanceiroService.getCardsByResponsavel(responsavel_fin_id);
            } else if (etapa_kanban) {
                cards = await CRMFinanceiroService.getCardsByEtapa(etapa_kanban);
            } else {
                cards = await CRMFinanceiroService.getAllCards();
            }

            res.json(cards);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Cria um novo card no Kanban Financeiro (Geralmente dispara no Gerar Ordem de Compra/Pagamento)
    static async create(req, res) {
        try {
            const id = await CRMFinanceiroService.createCard(req.body);
            res.status(201).json({ 
                message: 'Card criado no Kanban Financeiro com sucesso.', 
                id 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Atualiza dados gerais do card (Mudança manual de coluna, valores, notas, etc.)
    static async update(req, res) {
        try {
            const { id } = req.params;
            await CRMFinanceiroService.updateCard(id, req.body);
            res.json({ message: 'Card financeiro atualizado com sucesso.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // GATILHO: Notificação de Liberação - Rota específica para executar a liberação para a produção
    static async liberarProducao(req, res) {
        try {
            const { id } = req.params;
            await CRMFinanceiroService.executeLiberacaoProducao(id);
            res.json({ message: 'Pedido liberado para produção com sucesso e fábrica notificada!' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Rota para atualização rápida do status de pagamento (Ex: Quitado, Parcial)
    static async updateStatusPagamento(req, res) {
        try {
            const { id } = req.params;
            const { status_pagamento } = req.body;
            await CRMFinanceiroService.changePaymentStatus(id, status_pagamento);
            res.json({ message: 'Status de pagamento atualizado com sucesso.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Deleta o registro do Kanban Financeiro
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await CRMFinanceiroService.deleteCard(id);
            res.json({ message: 'Registro financeiro deletado com sucesso.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = CRMFinanceiroController;