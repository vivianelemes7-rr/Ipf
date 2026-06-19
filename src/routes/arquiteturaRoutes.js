const express = require('express');
const router = express.Router();
const ArquiteturaController = require('../controllers/arquiteturaController');
const { verificarToken, verificarModuloArquitetura } = require('../middlewares/autorizacaoMiddleware');

// Listar fila de arquitetura
router.get('/fila', verificarToken, verificarModuloArquitetura, ArquiteturaController.listarFila);

// Buscar pedido específico
router.get('/:id', verificarToken, verificarModuloArquitetura, ArquiteturaController.buscarPorPedido);

// Atualizar etapa do card
router.patch('/:id/etapa', verificarToken, verificarModuloArquitetura, ArquiteturaController.atualizarEtapa);

// UC14: Confirmar recebimento de matriz externa
router.patch('/:id/confirmar-matriz', verificarToken, verificarModuloArquitetura, ArquiteturaController.confirmarRecebimentoMatriz);

module.exports = router;
