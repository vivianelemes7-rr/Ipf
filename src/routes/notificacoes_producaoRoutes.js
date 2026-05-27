const express = require('express');
const router = express.Router();
const NotificacaoProducaoController = require('../controllers/notificacoes_producaoController');
const { verificarToken, verificarModuloProducao } = require('../middlewares/autorizacaoMiddleware');

router.get('/health', NotificacaoProducaoController.healthCheck);
router.post('/processar-atrasos', verificarToken, verificarModuloProducao, NotificacaoProducaoController.rodarAutomacao);
router.get('/:funcionarioId', verificarToken, verificarModuloProducao, NotificacaoProducaoController.listar);
router.patch('/ler/:id', verificarToken, verificarModuloProducao, NotificacaoProducaoController.marcarLida);
router.patch('/ler-tudo/:funcionarioId', verificarToken, verificarModuloProducao, NotificacaoProducaoController.marcarTodasLidas);
router.delete('/:id', verificarToken, verificarModuloProducao, NotificacaoProducaoController.excluir);

module.exports = router;
