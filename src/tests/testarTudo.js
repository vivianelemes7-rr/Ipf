/**
 * Testa os principais endpoints do backend e valida o frontend estático.
 * Uso: node src/tests/testarTudo.js
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
        const printed = typeof result.data === 'object'
            ? JSON.stringify(result.data, null, 2)
            : result.data;
        console.log('   ', printed.toString().slice(0, 1000));
    }
}

async function main() {
    console.log(`\n🧪 Testando integração em ${BASE}\n`);

    const health = await request('GET', '/health', { expect: 200 });
    log(health, 'Health API');
    if (!health.ok) {
        console.error('Servidor não respondeu. Execute: npm start');
        process.exit(1);
    }

    const root = await request('GET', '/', { expect: 200 });
    log(root, 'Frontend root /');

    const routeFallback = await request('GET', '/cadastro', { expect: 200 });
    log(routeFallback, 'Frontend route fallback /cadastro');

    const adminLogin = await request('POST', '/auth/login', {
        body: { email: 'admin@ipf.com', senha: 'admin123' },
        expect: 200
    });
    log(adminLogin, 'Login administrador');

    const adminToken = adminLogin.data?.token;
    if (!adminToken) {
        console.error('\nNão foi possível obter token admin para testes complementares.');
        process.exit(1);
    }

    const adminRequests = [
        { path: '/funcionarios', method: 'GET', expect: 200, label: 'Listar funcionários (admin)' },
        { path: '/funcionarios/vendedores', method: 'GET', expect: 200, label: 'Listar vendedores (admin)' },
        { path: '/crmFinanceiro', method: 'GET', expect: 200, label: 'Listar CRM Financeiro (admin)' },
        { path: '/gerencia/health', method: 'GET', expect: 200, label: 'Gerencia health (admin)' },
        { path: '/gerencia', method: 'GET', expect: 200, label: 'Gerencia painel (admin)' },
        { path: '/gerencia/indicadores', method: 'GET', expect: [200, 204], label: 'Gerencia indicadores (admin)' },
        { path: '/gerencia/vendedores', method: 'GET', expect: 200, label: 'Gerencia vendedores (admin)' },
        { path: '/gerencia/responsaveis', method: 'GET', expect: 200, label: 'Gerencia responsáveis (admin)' },
        { path: '/arquitetura/fila', method: 'GET', expect: [200, 404], label: 'Arquitetura fila (admin)' },
        { path: '/kanban/boards', method: 'GET', expect: [200, 403], label: 'Kanban boards (admin)' },
        { path: '/leads', method: 'GET', expect: 200, label: 'Listar leads (admin)' },
        { path: '/crm', method: 'GET', expect: 200, label: 'Listar CRM (admin)' },
        { path: '/vendas', method: 'GET', expect: 200, label: 'Listar vendas (admin)' },
        { path: '/clientes', method: 'GET', expect: 200, label: 'Listar clientes (admin)' },
        { path: '/pedidos', method: 'GET', expect: 200, label: 'Listar pedidos (admin)' },
        { path: '/producao/fila', method: 'GET', expect: 200, label: 'Producao fila (admin)' },
        { path: '/notificacoes-com/health', method: 'GET', expect: 200, label: 'Notificações comerciais health' },
        { path: '/notificacoes-fin/health', method: 'GET', expect: 200, label: 'Notificações financeiro health' },
        { path: '/notificacoes-logistica/health', method: 'GET', expect: 200, label: 'Notificações logística health' },
        { path: '/notificacoes-gerencia/health', method: 'GET', expect: 200, label: 'Notificações gerência health' },
        { path: '/notificacoes-producao/health', method: 'GET', expect: 200, label: 'Notificações produção health' },
        { path: '/notificacoes-com/1', method: 'GET', expect: [200, 404], label: 'Notificações comerciais usuário 1' },
        { path: '/notificacoes-fin/1', method: 'GET', expect: [200, 404], label: 'Notificações financeiro usuário 1' },
        { path: '/notificacoes-logistica/1', method: 'GET', expect: [200, 404], label: 'Notificações logística usuário 1' },
        { path: '/notificacoes-gerencia/1', method: 'GET', expect: [200, 404], label: 'Notificações gerência usuário 1' },
        { path: '/notificacoes-arq/1', method: 'GET', expect: [200, 404], label: 'Notificações arquitetura usuário 1' },
        { path: '/notificacoes-producao/1', method: 'GET', expect: [200, 404], label: 'Notificações produção usuário 1' },
        { path: '/permissoes/1', method: 'GET', expect: [200, 404], label: 'Permissões usuário 1' },
        { path: '/arquitetura/fila', method: 'GET', expect: [200, 404], label: 'Arquitetura fila (admin)' },
        { path: '/kanban/boards', method: 'GET', expect: [200, 403], label: 'Kanban boards (admin)' }
    ];

    for (const req of adminRequests) {
        const result = await request(req.method, req.path, { token: adminToken, expect: req.expect });
        log(result, req.label);
    }

    console.log('\n🎯 Testes concluídos.');
}

main().catch(err => {
    console.error('Erro:', err.message || err);
    process.exit(1);
});
