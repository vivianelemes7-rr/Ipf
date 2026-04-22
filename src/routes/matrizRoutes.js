const express = require('express');
const router = express.Router();
const MatrizController = require('../controllers/matrizController');

// Rota para verificar a regra de matriz de um pedido específico
router.get('/status/:id', MatrizController.verificarStatus);

module.exports = router;

