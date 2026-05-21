const express = require('express');
const router = express.Router();
const VendaController = require('../controllers/vendaController');
const { verificarToken, verificarModuloVendas, verificarModuloFinanceiro } = require('../middlewares/autorizacaoMiddleware');

router.get('/', verificarToken, verificarModuloVendas, VendaController.listar);
router.post('/converter', verificarToken, verificarModuloVendas, verificarModuloFinanceiro, VendaController.converter);

module.exports = router;
