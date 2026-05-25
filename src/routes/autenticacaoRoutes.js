const express = require('express');
const router = express.Router();
const AutenticacaoController = require('../controllers/autenticacaoController');
const { verificarToken } = require('../middlewares/autorizacaoMiddleware');
const { rateLimit } = require('../middlewares/rateLimitMiddleware');
const {
    validarCadastroPublico,
    validarCadastroAdmin,
    validarLogin,
    validarEmailObrigatorio,
    validarAlterarSenha
} = require('../middlewares/validacaoMiddleware');

router.post('/login', rateLimit(5, 60000), validarLogin, AutenticacaoController.login);
router.post('/cadastrar', rateLimit(3, 60000), validarCadastroPublico, AutenticacaoController.cadastrar);
router.post('/cadastrar-admin', rateLimit(3, 60000), validarCadastroAdmin, AutenticacaoController.cadastrarAdmin);
router.post('/esquecer-senha', rateLimit(5, 60000), validarEmailObrigatorio, AutenticacaoController.esquecerSenha);
router.post('/alterar-senha', verificarToken, validarAlterarSenha, AutenticacaoController.alterarSenha);
router.patch('/alterar-senha', verificarToken, validarAlterarSenha, AutenticacaoController.alterarSenha);

module.exports = router;
