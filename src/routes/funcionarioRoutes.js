const express = require('express');
const router = express.Router();
const FuncionarioController = require('../controllers/funcionarioController');
const { verificarAcesso } = require('../middlewares/autorizacaoMiddleware');
const { validarAtualizacaoFuncionario, validarCadastroVendedor } = require('../middlewares/validacaoMiddleware');

router.get('/vendedores', verificarAcesso(['Administrador', 'Gerente']), FuncionarioController.listarVendedores);
router.post('/vendedores', verificarAcesso(['Administrador', 'Gerente']), validarCadastroVendedor, FuncionarioController.criarVendedor);
router.put('/vendedores/:id', verificarAcesso(['Administrador', 'Gerente']), validarAtualizacaoFuncionario, FuncionarioController.editarVendedor);
router.patch('/vendedores/:id/ativar', verificarAcesso(['Administrador', 'Gerente']), FuncionarioController.ativarVendedor);
router.patch('/vendedores/:id/desativar', verificarAcesso(['Administrador', 'Gerente']), FuncionarioController.desativarVendedor);

router.get('/', verificarAcesso(['Administrador']), FuncionarioController.listar);
router.put('/:id', verificarAcesso(['Administrador']), validarAtualizacaoFuncionario, FuncionarioController.editar);
router.delete('/:id', verificarAcesso(['Administrador']), FuncionarioController.excluir);

module.exports = router;
