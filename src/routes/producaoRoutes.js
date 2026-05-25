const express = require('express');
const router = express.Router();
const ProducaoController = require('../controllers/producaoController');
const { verificarToken, verificarModuloProducao } = require('../middlewares/autorizacaoMiddleware');

// Rota POST para avançar o pedido: /api/producao/avancar/1
router.post('/avancar/:id', verificarToken, verificarModuloProducao, ProducaoController.moverPedido);

// Rota GET para ver a fila: /api/producao/fila
router.get('/fila', verificarToken, verificarModuloProducao, ProducaoController.listarFila);

module.exports = router;

