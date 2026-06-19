// Script de teste de integração — verifica todos os módulos criados/modificados
// Roda sem banco de dados real

process.env.JWT_SECRET = 'test_secret_32_chars_minimum_len_ok';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';
process.env.DB_PORT = '3306';

const results = { ok: [], err: [] };

const modulos = [
    // Modelos novos
    './src/models/kanban_logisticaModel',
    './src/models/notificacoes_logisticaModel',
    './src/models/vendaModel',
    // Controllers novos
    './src/controllers/kanbanController',
    './src/controllers/vendaController',
    './src/controllers/notificacoes_logisticaController',
    // Rotas novas
    './src/routes/kanbanRoutes',
    './src/routes/vendaRoutes',
    './src/routes/notificacoes_logisticaRoutes',
    // Services novos/modificados
    './src/services/kanbanService',
    './src/services/notificacoes_logisticaService',
    './src/services/vendaService',
    // app.js completo
    './src/app',
];

for (const modulo of modulos) {
    try {
        require(modulo);
        results.ok.push(modulo);
        console.log(`✅ OK  ${modulo}`);
    } catch (e) {
        results.err.push({ modulo, erro: e.message });
        console.log(`❌ ERR ${modulo}: ${e.message}`);
    }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ ${results.ok.length} módulos carregados com sucesso`);
if (results.err.length > 0) {
    console.log(`❌ ${results.err.length} erro(s):`);
    results.err.forEach(({ modulo, erro }) => console.log(`   - ${modulo}: ${erro}`));
    process.exit(1);
} else {
    console.log('🎉 TODOS OS MÓDULOS CARREGADOS SEM ERROS');
    process.exit(0);
}
