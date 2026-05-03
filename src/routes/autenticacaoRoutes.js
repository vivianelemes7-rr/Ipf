const express = require('express');
const router = express.Router();
const AutenticacaoController = require('../controllers/autenticacaoController');

router.post('/login', AutenticacaoController.login);
router.post('/cadastrar', AutenticacaoController.cadastrar);

module.exports = router;