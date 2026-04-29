const express = require('express');
const router = express.Router();
const NotificacoesComController = require('../controllers/notificacoes_comController');

// Rota para buscar todas as notificações de um funcionário (Ex: /api/notificacoes-com/1)
router.get('/:funcionarioId', NotificacoesComController.listar);

// Rota para marcar uma notificação como lida
router.patch('/ler/:id', NotificacoesComController.marcarLida);

// Rota para marcar todas como lidas
router.patch('/ler-tudo/:funcionarioId', NotificacoesComController.marcarTodasLidas);

// Rota para excluir uma notificação
router.delete('/:id', NotificacoesComController.excluir);

// Rota manual para disparar a automação (útil para testes sem esperar o Cron)
router.post('/processar-atrasos', NotificacoesComController.rodarAutomacao);

module.exports = router;