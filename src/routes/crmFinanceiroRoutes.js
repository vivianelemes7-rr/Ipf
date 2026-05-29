const express = require('express');
const router = express.Router();
const CRMFinanceiroController = require('../controllers/crm_financeiroController');
const { verificarToken, verificarModuloFinanceiro } = require('../middlewares/autorizacaoMiddleware');


router.use(verificarToken, verificarModuloFinanceiro);
router.get('/', CRMFinanceiroController.getAll);
router.post('/', CRMFinanceiroController.create);
router.put('/:id', CRMFinanceiroController.update);
router.delete('/:id', CRMFinanceiroController.delete);
router.patch('/:id/liberar-producao', CRMFinanceiroController.liberarProducao);
router.patch('/:id/status-pagamento', CRMFinanceiroController.updateStatusPagamento);

module.exports = router;