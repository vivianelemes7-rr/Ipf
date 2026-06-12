const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');
const { verificarToken, verificarModuloVendas } = require('../middlewares/autorizacaoMiddleware');

router.get('/', verificarToken, verificarModuloVendas, LeadController.listar);
router.post('/cadastrar', verificarToken, verificarModuloVendas, LeadController.criar);

module.exports = router;

