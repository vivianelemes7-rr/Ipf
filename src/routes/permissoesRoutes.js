const express = require('express');
const router = express.Router();
const PermissoesController = require('../controllers/permissoesController');
const { verificarToken, verificarAcesso } = require('../middlewares/autorizacaoMiddleware');

// Obter permissões do funcionário
router.get('/:funcionarioId', verificarToken, PermissoesController.obter);

// Atualizar permissões manualmente
router.put('/:funcionarioId', verificarAcesso(['Gerente']), PermissoesController.atualizar);

// Gerar permissões automáticas por cargo (aprovação)
router.post('/:funcionarioId/gerar-por-cargo', verificarAcesso(['Gerente']), PermissoesController.gerarPorCargo);

module.exports = router;
