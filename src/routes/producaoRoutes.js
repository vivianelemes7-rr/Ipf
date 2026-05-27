const express = require('express');
const router = express.Router();
const ProducaoController = require('../controllers/producaoController');
const { verificarToken, verificarModuloProducao } = require('../middlewares/autorizacaoMiddleware');

router.get('/fila', verificarToken, verificarModuloProducao, ProducaoController.listarFila);
router.get('/:id', verificarToken, verificarModuloProducao, ProducaoController.buscarPorId);
router.post('/avancar/:id', verificarToken, verificarModuloProducao, ProducaoController.moverPedido);
router.patch('/:id/etapa', verificarToken, verificarModuloProducao, ProducaoController.atualizarEtapa);
router.patch('/:id/responsavel', verificarToken, verificarModuloProducao, ProducaoController.atualizarResponsavel);
router.patch('/:id/matriz', verificarToken, verificarModuloProducao, ProducaoController.atualizarMatriz);
router.patch('/:id/datas', verificarToken, verificarModuloProducao, ProducaoController.atualizarDatas);
router.delete('/:id', verificarToken, verificarModuloProducao, ProducaoController.remover);

module.exports = router;

