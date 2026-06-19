const express = require('express');
const router = express.Router();
const NotificacaoLogisticaController = require('../controllers/notificacoes_logisticaController');
const { verificarToken, verificarAcesso } = require('../middlewares/autorizacaoMiddleware');

const verificarLogistica = verificarAcesso(['Logistica', 'Administrador', 'Gerente']);

router.use(verificarToken, verificarLogistica);

router.get('/health', NotificacaoLogisticaController.healthCheck);
router.post('/processar-atrasos', NotificacaoLogisticaController.rodarAutomacao);
router.get('/:funcionarioId', NotificacaoLogisticaController.listar);
router.patch('/ler/:id', NotificacaoLogisticaController.marcarLida);
router.patch('/ler-tudo/:funcionarioId', NotificacaoLogisticaController.marcarTodasLidas);
router.delete('/:id', NotificacaoLogisticaController.excluir);

module.exports = router;
