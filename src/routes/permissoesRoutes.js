const express = require('express');
const router = express.Router();
const PermissoesController = require('../controllers/permissoesController');
const { verificarAcesso } = require('../middlewares/autorizacaoMiddleware');

// Obter permissões do funcionário
router.get('/:funcionarioId', verificarAcesso(['Administrador']), PermissoesController.obter);

// Atualizar permissões manualmente
router.put('/:funcionarioId', verificarAcesso(['Administrador']), PermissoesController.atualizar);

// Gerar permissões automáticas por cargo (aprovação)
router.post('/:funcionarioId/gerar-por-cargo', verificarAcesso(['Administrador']), PermissoesController.gerarPorCargo);

module.exports = router;
