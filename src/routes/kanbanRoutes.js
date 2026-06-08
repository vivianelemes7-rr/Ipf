const express = require('express');
const router = express.Router();
const KanbanController = require('../controllers/kanbanController');
const { verificarToken } = require('../middlewares/autorizacaoMiddleware');

// Unified Kanban endpoints
router.get('/boards', verificarToken, KanbanController.listBoards);
router.post('/boards/:boardKey/cards', verificarToken, KanbanController.createCard);
router.patch('/boards/:boardKey/cards/:cardId', verificarToken, KanbanController.patchCard);
router.delete('/boards/:boardKey/cards/:cardId', verificarToken, KanbanController.deleteCard);

module.exports = router;
