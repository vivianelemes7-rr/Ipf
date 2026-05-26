const express = require('express');
const router = express.Router();
const NotificacaoArqController = require('../controllers/notificacoes_arqController');
const { verificarToken, verificarModuloArquitetura } = require('../middlewares/autorizacaoMiddleware');

// Health check
router.get('/health', verificarToken, NotificacaoArqController.healthCheck);

// Listar notificações de um funcionário
router.get('/:funcionarioId', verificarToken, verificarModuloArquitetura, NotificacaoArqController.listar);

// Marcar uma notificação como lida
router.patch('/:id/lida', verificarToken, verificarModuloArquitetura, NotificacaoArqController.marcarLida);

// Marcar todas como lidas
router.patch('/:funcionarioId/todas-lidas', verificarToken, verificarModuloArquitetura, NotificacaoArqController.marcarTodasLidas);

// Excluir notificação
router.delete('/:id', verificarToken, verificarModuloArquitetura, NotificacaoArqController.excluir);

// Rodar automação manualmente
router.post('/automacao', verificarToken, NotificacaoArqController.rodarAutomacao);

module.exports = router;
