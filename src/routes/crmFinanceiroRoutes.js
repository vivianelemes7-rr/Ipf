const express = require('express');
const router = express.Router();
const CRMFinanceiroController = require('../controllers/crm_financeiroController');
const { verificarToken, verificarModuloFinanceiro } = require('../middlewares/autorizacaoMiddleware');

router.use(verificarToken, verificarModuloFinanceiro);

router.get('/financeiro', CRMFinanceiroController.getAll);
router.post('/financeiro', CRMFinanceiroController.create);
router.put('/financeiro/:id', CRMFinanceiroController.update);
router.delete('/financeiro/:id', CRMFinanceiroController.delete);

router.patch('/financeiro/:id/liberar-producao', CRMFinanceiroController.liberarProducao);
router.patch('/financeiro/:id/status-pagamento', CRMFinanceiroController.updateStatusPagamento);

module.exports = router;
