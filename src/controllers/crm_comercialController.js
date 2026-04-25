const CRMComercialService = require('../services/crm_comercialService');

class CRMComercialController {
    // Lista todos os cards ou filtra por vendedor
    static async getAll(req, res) {
        try {
            const { vendedor_id } = req.query;
            let cards;

            if (vendedor_id) {
                cards = await CRMComercialService.getCardsByVendedor(vendedor_id);
            } else {
                cards = await CRMComercialService.getAllCards();
            }

            res.json(cards);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Cria um novo card no CRM
    static async create(req, res) {
        try {
            const id = await CRMComercialService.createCard(req.body);
            res.status(201).json({ 
                message: 'Card criado no CRM com sucesso.', 
                id 
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Atualiza dados gerais do card
    static async update(req, res) {
        try {
            const { id } = req.params;
            await CRMComercialService.updateCard(id, req.body);
            res.json({ message: 'Card atualizado com sucesso.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Rota específica para quando o card é movido para "Ganho"
    static async setGanho(req, res) {
        try {
            const { id } = req.params;
            const { numero_pedido } = req.body;
            await CRMComercialService.finalizeWinningSale(id, numero_pedido);
            res.json({ message: 'Venda finalizada com sucesso! Pedido gerado.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Rota específica para quando o card é movido para "Perdido"
    static async setPerdido(req, res) {
        try {
            const { id } = req.params;
            const { motivo_perda } = req.body;
            await CRMComercialService.finalizeLostSale(id, motivo_perda);
            res.json({ message: 'Lead marcado como perdido.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // Deleta o registro do CRM
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await CRMComercialService.deleteCard(id);
            res.json({ message: 'Registro deletado com sucesso.' });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}

module.exports = CRMComercialController;