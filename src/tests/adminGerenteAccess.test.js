const assert = require('assert');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'teste_jwt_secret_seguro_com_mais_de_32_chars';

const AutenticacaoService = require('../services/autenticacaoService');
const PermissoesService = require('../services/permissoesService');
const {
    verificarAcesso,
    verificarModuloFinanceiro,
    checkPermission
} = require('../middlewares/autorizacaoMiddleware');

function test(nome, fn) {
    try {
        fn();
        console.log(`PASS ${nome}`);
    } catch (erro) {
        console.error(`FAIL ${nome}`);
        console.error(erro.message);
        process.exitCode = 1;
    }
}

function criarToken(cargo, permissoes = {}) {
    return jwt.sign({ id: 1, email: 'teste@ipf.com', cargo, permissoes }, process.env.JWT_SECRET);
}

function executarMiddleware(middleware, cargo, permissoes = {}) {
    const req = {
        headers: {
            authorization: `Bearer ${criarToken(cargo, permissoes)}`
        }
    };
    let chamado = false;
    let erroRecebido = null;

    middleware(req, {}, (erro) => {
        if (erro) {
            erroRecebido = erro;
            return;
        }
        chamado = true;
    });

    return { chamado, erroRecebido };
}

test('AutenticacaoService mantém administrador como cargo distinto', () => {
    assert.strictEqual(AutenticacaoService.normalizarCargo('Administrador'), 'administrador');
    assert.strictEqual(AutenticacaoService.formatarCargoParaBanco('administrador'), 'Administrador');
    assert.strictEqual(AutenticacaoService.isCargoValido('administrador'), true);
});

test('PermissoesService gera administrador com acesso total', () => {
    const permissoes = PermissoesService.gerarPermissoesPorCargo('administrador');

    assert.strictEqual(permissoes.modulo_vendas, true);
    assert.strictEqual(permissoes.modulo_financeiro, true);
    assert.strictEqual(permissoes.modulo_producao, true);
    assert.strictEqual(permissoes.modulo_arquitetura, true);
    assert.strictEqual(permissoes.pode_deletar, true);
    assert.strictEqual(permissoes.pode_forcar_transicao, true);
    assert.strictEqual(permissoes.ver_apenas_proprio, false);
});

test('PermissoesService limita gerente ao escopo comercial', () => {
    const permissoes = PermissoesService.gerarPermissoesPorCargo('gerente');

    assert.strictEqual(permissoes.modulo_vendas, true);
    assert.strictEqual(permissoes.modulo_financeiro, false);
    assert.strictEqual(permissoes.modulo_producao, false);
    assert.strictEqual(permissoes.modulo_arquitetura, false);
    assert.strictEqual(permissoes.pode_deletar, false);
    assert.strictEqual(permissoes.pode_forcar_transicao, false);
    assert.strictEqual(permissoes.pode_mover_qualquer_etapa, false);
    assert.strictEqual(permissoes.ver_apenas_proprio, false);
});

test('verificarAcesso permite admin e nega gerente em rota admin-only', () => {
    const admin = executarMiddleware(verificarAcesso(['Administrador']), 'Administrador');
    const gerente = executarMiddleware(verificarAcesso(['Administrador']), 'Gerente');

    assert.strictEqual(admin.chamado, true);
    assert.strictEqual(gerente.erroRecebido.statusCode, 403);
});

test('verificarModulo nao usa gerente como bypass global', () => {
    const gerente = executarMiddleware(verificarModuloFinanceiro, 'Gerente', { modulo_financeiro: false });
    const admin = executarMiddleware(verificarModuloFinanceiro, 'Administrador', { modulo_financeiro: false });

    assert.strictEqual(gerente.erroRecebido.statusCode, 403);
    assert.strictEqual(admin.chamado, true);
});

test('checkPermission nao usa gerente como bypass global', () => {
    const gerente = executarMiddleware(checkPermission('pode_deletar'), 'Gerente', { pode_deletar: false });
    const admin = executarMiddleware(checkPermission('pode_deletar'), 'Administrador', { pode_deletar: false });

    assert.strictEqual(gerente.erroRecebido.statusCode, 403);
    assert.strictEqual(admin.chamado, true);
});
