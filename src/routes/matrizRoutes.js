const express = require('express');
const router = express.Router();
const MatrizController = require('../controllers/matrizController');
const { verificarToken, verificarModuloArquitetura } = require('../middlewares/autorizacaoMiddleware');

// Rota para verificar a regra de matriz de um pedido específico
router.get('/status/:id', verificarToken, verificarModuloArquitetura, MatrizController.verificarStatus);

module.exports = router;

