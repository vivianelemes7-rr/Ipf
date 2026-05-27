const CRMComercialService = require('../services/crm_comercialService');
const { asyncHandler } = require('../utils/asyncHandler');

class CRMComercialController {
    static getAll = asyncHandler(async (req, res) => {
        const { vendedor_id } = req.query;
        const cards = vendedor_id
            ? await CRMComercialService.getCardsByVendedor(vendedor_id)
            : await CRMComercialService.getAllCards();

        res.json(cards);
    });

    static create = asyncHandler(async (req, res) => {
        const id = await CRMComercialService.createCard(req.body);
        res.status(201).json({
            sucesso: true,
            mensagem: 'Card criado no CRM com sucesso.',
            id
        });
    });

    static update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await CRMComercialService.updateCard(id, req.body);
        res.json({ sucesso: true, mensagem: 'Card atualizado com sucesso.' });
    });

    static moverEtapa = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { etapa_kanban, etapa } = req.body;
        const card = await CRMComercialService.moverEtapa(id, etapa_kanban || etapa);
        res.json({ sucesso: true, dados: card });
    });

    static anexarProposta = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const card = await CRMComercialService.anexarProposta(id, req.body.proposta_url);
        res.json({ sucesso: true, dados: card });
    });

    static marcarPropostaEnviada = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const card = await CRMComercialService.marcarPropostaEnviada(id);
        res.json({ sucesso: true, dados: card });
    });

    static setGanho = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { numero_pedido, tipo_pedido } = req.body;
        const resultado = await CRMComercialService.finalizeWinningSale(id, numero_pedido, tipo_pedido);
        res.json({ sucesso: true, mensagem: 'Venda finalizada com sucesso! Pedido gerado.', dados: resultado });
    });

    static setPerdido = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { motivo_perda } = req.body;
        await CRMComercialService.finalizeLostSale(id, motivo_perda);
        res.json({ sucesso: true, mensagem: 'Lead marcado como perdido.' });
    });

    static delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await CRMComercialService.deleteCard(id);
        res.json({ sucesso: true, mensagem: 'Registro deletado com sucesso.' });
    });
}

module.exports = CRMComercialController;
