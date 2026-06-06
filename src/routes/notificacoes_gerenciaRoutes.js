const express = require('express');
const router = express.Router();
const NotificacaoGerenciaController = require('../controllers/notificacoes_gerenciaController');
const { verificarToken, verificarAcesso } = require('../middlewares/autorizacaoMiddleware');

const verificarGerencia = verificarAcesso(['Gerente', 'Administrador']);

router.use(verificarToken, verificarGerencia);

router.get('/health', NotificacaoGerenciaController.healthCheck);
router.post('/processar-alertas', NotificacaoGerenciaController.rodarAutomacao);
router.get('/:funcionarioId', NotificacaoGerenciaController.listar);
router.patch('/ler/:id', NotificacaoGerenciaController.marcarLida);
router.patch('/ler-tudo/:funcionarioId', NotificacaoGerenciaController.marcarTodasLidas);
router.delete('/:id', NotificacaoGerenciaController.excluir);

module.exports = router;
