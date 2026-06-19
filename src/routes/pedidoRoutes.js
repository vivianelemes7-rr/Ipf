const express = require('express');
const router = express.Router();
const PedidoController = require('../controllers/pedidoController');
const {
    verificarToken,
    verificarModuloVendas,
    verificarModuloFinanceiro,
    verificarModuloProducao,
    verificarQualquerModulo,
    checkPermission
} = require('../middlewares/autorizacaoMiddleware');

const verificarModulosPedido = verificarQualquerModulo([
    'modulo_vendas',
    'modulo_financeiro',
    'modulo_arquitetura',
    'modulo_producao'
]);

router.get('/', verificarToken, verificarModulosPedido, PedidoController.listar);
router.get('/:id', verificarToken, verificarModulosPedido, PedidoController.buscarPorId);
router.post('/', verificarToken, verificarModuloVendas, PedidoController.criar);
router.put('/:id', verificarToken, verificarModuloVendas, PedidoController.atualizar);
router.patch('/:id/avancar', verificarToken, verificarModuloFinanceiro, PedidoController.avancar);
router.patch('/:id/cancelar', verificarToken, checkPermission('pode_forcar_transicao'), PedidoController.cancelar);
router.patch('/:id/finalizar', verificarToken, verificarModuloProducao, PedidoController.finalizar);

module.exports = router;
