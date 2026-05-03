const express = require('express');
const router = express.Router();
const FuncionarioController = require('../controllers/funcionarioController');
const verificarAcesso = require('../middlewares/autorizacaoMiddleware');

// Módulos específicos
router.get('/vendas', verificarAcesso(['Vendedor', 'Gerente'], 'modulo_vendas'), (req, res) => res.json({ msg: "Área de Vendas" }));
router.get('/financeiro', verificarAcesso(['Financeiro', 'Gerente'], 'modulo_financeiro'), (req, res) => res.json({ msg: "Área Financeira" }));

// Gestão de Funcionários (Exclusivo Gerente)
router.get('/', verificarAcesso(['Gerente']), FuncionarioController.listar);
router.put('/:id', verificarAcesso(['Gerente']), FuncionarioController.editar);
router.delete('/:id', verificarAcesso(['Gerente']), FuncionarioController.excluir);

module.exports = router;