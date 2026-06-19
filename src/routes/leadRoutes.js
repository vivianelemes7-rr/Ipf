const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');
const { verificarToken, verificarModuloVendas } = require('../middlewares/autorizacaoMiddleware');

router.get('/', verificarToken, verificarModuloVendas, LeadController.listar);
<<<<<<< HEAD
router.post('/', verificarToken, verificarModuloVendas, LeadController.criar);        // alias para retrocompatibilidade
=======
>>>>>>> f95ee95a233b645bb4f881cfe14ebc2f4656b1da
router.post('/cadastrar', verificarToken, verificarModuloVendas, LeadController.criar);

module.exports = router;

