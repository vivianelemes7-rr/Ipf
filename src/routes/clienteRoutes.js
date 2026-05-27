const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clienteController');
const { verificarToken, verificarModuloVendas } = require('../middlewares/autorizacaoMiddleware');

router.get('/', verificarToken, verificarModuloVendas, ClienteController.listar);
router.get('/:id', verificarToken, verificarModuloVendas, ClienteController.buscarPorId);
router.post('/', verificarToken, verificarModuloVendas, ClienteController.criar);
router.put('/:id', verificarToken, verificarModuloVendas, ClienteController.atualizar);
router.patch('/:id/converter', verificarToken, verificarModuloVendas, ClienteController.converter);
router.patch('/:id/arquivar', verificarToken, verificarModuloVendas, ClienteController.arquivar);

module.exports = router;
