const express = require('express');
const router = express.Router();
const CRMComercialController = require('../controllers/crm_comercialController');
const { verificarToken, verificarModuloVendas } = require('../middlewares/autorizacaoMiddleware');

// Rotas do CRM Comercial

// Lista todos os cards (Suporta query param: /crm?vendedor_id=1)
router.get('/', verificarToken, verificarModuloVendas, CRMComercialController.getAll);

// Cria um novo card no Kanban
router.post('/', verificarToken, verificarModuloVendas, CRMComercialController.create);

// Atualiza dados gerais de um card específico
router.put('/:id', verificarToken, verificarModuloVendas, CRMComercialController.update);

// Rota específica para finalizar venda como GANHA (Exige numero_pedido no body)
router.patch('/:id/ganho', verificarToken, verificarModuloVendas, CRMComercialController.setGanho);

// Rota específica para finalizar venda como PERDIDA (Exige motivo_perda no body)
router.patch('/:id/perdido', verificarToken, verificarModuloVendas, CRMComercialController.setPerdido);

// Deleta um card do sistema
router.delete('/:id', verificarToken, verificarModuloVendas, CRMComercialController.delete);

module.exports = router;