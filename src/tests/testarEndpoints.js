/**
 * Testa endpoints HTTP do projeto.
 * Uso: node src/tests/testarEndpoints.js
 * Requer servidor rodando (npm start) e .env configurado.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function request(method, path, { body, token, expect } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    const text = await res.text();
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    const ok = Array.isArray(expect)
        ? expect.includes(res.status)
        : res.status === expect;

    return { ok, status: res.status, data, path, method };
}

function log(result, label) {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${label} → ${result.method} ${result.path} [${result.status}]`);
    if (!result.ok && result.data) {
        console.log('   ', typeof result.data === 'object' ? JSON.stringify(result.data).slice(0, 200) : result.data);
    }
}

async function main() {
    console.log(`\n🧪 Testando API em ${BASE}\n`);

    const health = await request('GET', '/health', { expect: 200 });
    log(health, 'Health');
    if (!health.ok) {
        console.error('\nServidor não respondeu. Execute: npm start\n');
        process.exit(1);
    }

    const ts = Date.now();
    const emailNovo = `teste.rest.${ts}@ipf.com`;
    const senha = 'Senha123!';

    const cadastro = await request('POST', '/auth/cadastrar', {
        body: { nome: 'Teste REST', email: emailNovo, senha },
        expect: 201
    });
    log(cadastro, 'Cadastro público');

    const loginPendente = await request('POST', '/auth/login', {
        body: { email: emailNovo, senha },
        expect: 403
    });
    log(loginPendente, 'Login pendente (403)');

    const esquecer = await request('POST', '/auth/esquecer-senha', {
        body: { email: emailNovo },
        expect: [200, 404, 500]
    });
    log(esquecer, 'Esquecer senha');

    const cadastroVazio = await request('POST', '/auth/cadastrar', {
        body: {},
        expect: 422
    });
    log(cadastroVazio, 'Cadastro vazio (422)');

    const loginAdmin = await request('POST', '/auth/login', {
        body: { email: 'admin@ipf.com', senha: 'admin123' },
        expect: [200, 401]
    });
    log(loginAdmin, 'Login admin');

    let adminToken = loginAdmin.data?.token;
    let funcionarioId = cadastro.data?.id;

    if (loginAdmin.ok && adminToken) {
        const listar = await request('GET', '/funcionarios', { token: adminToken, expect: 200 });
        log(listar, 'Listar funcionários');

        if (!funcionarioId && Array.isArray(listar.data)) {
            const pendente = listar.data.find(f => f.email === emailNovo);
            funcionarioId = pendente?.id;
        }

        if (funcionarioId) {
            const aprovar = await request('POST', `/permissoes/${funcionarioId}/gerar-por-cargo`, {
                token: adminToken,
                body: { cargo: 'Vendedor' },
                expect: 200
            });
            log(aprovar, 'Aprovar usuário (gerar-por-cargo)');
        }
    }

    const loginOk = await request('POST', '/auth/login', {
        body: { email: emailNovo, senha },
        expect: [200, 403]
    });
    log(loginOk, 'Login após aprovação');

    const token = loginOk.data?.token;
    if (token) {
        const leads = await request('GET', '/leads', { token, expect: [200, 403] });
        log(leads, 'Listar leads');

        const leadCriar = await request('POST', '/leads/cadastrar', {
            token,
            body: { nome_contato: 'Lead REST', telefone: '11999990000', email: `lead.${ts}@ipf.com` },
            expect: [201, 400, 403]
        });
        log(leadCriar, 'Criar lead');

        const crm = await request('GET', '/crm', { token, expect: [200, 403] });
        log(crm, 'Listar CRM');

        const vendas = await request('GET', '/vendas', { token, expect: [200, 403] });
        log(vendas, 'Listar vendas');

        const fila = await request('GET', '/producao/fila', { token, expect: [200, 403] });
        log(fila, 'Fila produção');

        const matriz = await request('GET', '/matriz/status/1', { token, expect: [200, 403, 404, 500] });
        log(matriz, 'Matriz status');

        if (funcionarioId) {
            const perm = await request('GET', `/permissoes/${funcionarioId}`, { token, expect: [200, 403, 404] });
            log(perm, 'Obter permissões');

            const notif = await request('GET', `/notificacoes-com/${funcionarioId}`, { expect: [200, 500] });
            log(notif, 'Notificações');
        }
    }

    console.log('\nConcluído. Tokens expirados nos .rest devem ser renovados via login.\n');
}

main().catch(err => {
    console.error('Erro:', err.message);
    process.exit(1);
});
