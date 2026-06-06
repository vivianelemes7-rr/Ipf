const express = require('express');
const router = express.Router();
const GerenciaController = require('../controllers/gerenciaController');
const { verificarToken, verificarAcesso } = require('../middlewares/autorizacaoMiddleware');

const verificarGerencia = verificarAcesso(['Gerente', 'Administrador']);

router.use(verificarToken, verificarGerencia);

router.get('/health', GerenciaController.healthCheck);
router.get('/kanban', GerenciaController.kanban);
router.post('/kanban/cards', GerenciaController.criarCardKanban);
router.get('/kanban/cards/:id', GerenciaController.buscarCardKanban);
router.patch('/kanban/cards/:id', GerenciaController.atualizarCardKanban);
router.patch('/kanban/cards/:id/etapa', GerenciaController.moverCardKanban);
router.delete('/kanban/cards/:id', GerenciaController.deletarCardKanban);
router.get('/', GerenciaController.painel);
router.get('/indicadores', GerenciaController.indicadores);
router.get('/pedidos-parados', GerenciaController.pedidosParados);
router.get('/pedidos-atrasados', GerenciaController.pedidosAtrasados);
router.get('/vendedores', GerenciaController.vendedores);
router.get('/responsaveis', GerenciaController.responsaveis);

module.exports = router;
