const express = require('express');
const router = express.Router();
const FuncionarioController = require('../controllers/funcionarioController');
const { verificarAcesso } = require('../middlewares/autorizacaoMiddleware');
const { validarAtualizacaoFuncionario } = require('../middlewares/validacaoMiddleware');

router.get('/', verificarAcesso(['Gerente']), FuncionarioController.listar);
router.put('/:id', verificarAcesso(['Gerente']), validarAtualizacaoFuncionario, FuncionarioController.editar);
router.delete('/:id', verificarAcesso(['Gerente']), FuncionarioController.excluir);

module.exports = router;
