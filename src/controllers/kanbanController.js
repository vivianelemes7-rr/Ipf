const KanbanService = require('../services/kanbanService');
const { asyncHandler } = require('../utils/asyncHandler');

class KanbanController {
    static listBoards = asyncHandler(async (req, res) => {
        const response = await KanbanService.getBoards();
        res.status(200).json(response);
    });

    static createCard = asyncHandler(async (req, res) => {
        const { boardKey } = req.params;
        const card = await KanbanService.createCard(boardKey, req.body, req.usuario);
        res.status(201).json({
            success: true,
            message: 'Card criado com sucesso.',
            card
        });
    });

    static patchCard = asyncHandler(async (req, res) => {
        const { boardKey, cardId } = req.params;
        const card = await KanbanService.updateCard(boardKey, cardId, req.body, req.usuario);
        res.status(200).json({
            success: true,
            message: 'Card atualizado com sucesso.',
            card
        });
    });

    static deleteCard = asyncHandler(async (req, res) => {
        const { boardKey, cardId } = req.params;
        await KanbanService.deleteCard(boardKey, cardId);
        res.status(200).json({
            success: true,
            message: 'Card excluído com sucesso.'
        });
    });
}

module.exports = KanbanController;
