const express = require('express');
const router = express.Router();
const ProducaoController = require('../controllers/producaoController');

// Rota POST para avançar o pedido: /api/producao/avancar/1
router.post('/avancar/:id', ProducaoController.moverPedido);

// Rota GET para ver a fila: /api/producao/fila
router.get('/fila', ProducaoController.listarFila);

module.exports = router;

