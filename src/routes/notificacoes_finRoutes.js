const express = require('express');
const router = express.Router();
const NotificacoesFinController = require('../controllers/notificacoes_finController');

// Rota de health check para o módulo de notificações financeiras
router.get('/health', NotificacoesFinController.healthCheck);

// Rota manual para disparar a automação (útil para testes sem esperar o Cron)
router.post('/processar-atrasos', NotificacoesFinController.rodarAutomacao);

// Rota para buscar todas as notificações de um funcionário (Ex: /api/notificacoes-fin/1)
router.get('/:funcionarioId', NotificacoesFinController.listar);

// Rota para marcar uma notificação como lida
router.patch('/ler/:id', NotificacoesFinController.marcarLida);

// Rota para marcar todas como lidas
router.patch('/ler-tudo/:funcionarioId', NotificacoesFinController.marcarTodasLidas);

// Rota para excluir uma notificação
router.delete('/:id', NotificacoesFinController.excluir);

module.exports = router;