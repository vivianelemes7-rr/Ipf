const express = require('express');
const router = express.Router();
const CRMComercialController = require('../controllers/crmComercialController');

// Rotas do CRM Comercial

// Lista todos os cards (Suporta query param: /crm?vendedor_id=1)
router.get('/', CRMComercialController.getAll);

// Cria um novo card no Kanban
router.post('/', CRMComercialController.create);

// Atualiza dados gerais de um card específico
router.put('/:id', CRMComercialController.update);

// Rota específica para finalizar venda como GANHA (Exige numero_pedido no body)
router.patch('/:id/ganho', CRMComercialController.setGanho);

// Rota específica para finalizar venda como PERDIDA (Exige motivo_perda no body)
router.patch('/:id/perdido', CRMComercialController.setPerdido);

// Deleta um card do sistema
router.delete('/:id', CRMComercialController.delete);

module.exports = router;