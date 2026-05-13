// 🧪 Testes de Validação - Verificar Erros Potenciais
// Executar com: node src/tests/validacao_test.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Cores para output
const cores = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

console.log(`${cores.blue}🧪 INICIANDO TESTES DE VALIDAÇÃO${cores.reset}\n`);

// Teste 1: Verificar se .env está configurado
console.log(`${cores.yellow}[TESTE 1] Verificando variáveis de ambiente...${cores.reset}`);
const variaveis_obrigatorias = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const faltando = variaveis_obrigatorias.filter(v => !process.env[v]);

if (faltando.length > 0) {
    console.log(`${cores.red}❌ ERRO: Variáveis faltando: ${faltando.join(', ')}${cores.reset}`);
    console.log(`${cores.yellow}   Copie .env.example para .env e configure${cores.reset}\n`);
} else {
    console.log(`${cores.green}✅ Todas as variáveis configuradas${cores.reset}\n`);
}

// Teste 2: Verificar JWT_SECRET inseguro
console.log(`${cores.yellow}[TESTE 2] Verificando segurança do JWT_SECRET...${cores.reset}`);
const JWT_SECRET = process.env.JWT_SECRET;
const jwt_inseguros = ['chave_mestra_ipf_2026', 'secret', '123456', 'password'];

if (jwt_inseguros.includes(JWT_SECRET)) {
    console.log(`${cores.red}❌ ERRO CRÍTICO: JWT_SECRET é um padrão conhecido (${JWT_SECRET})${cores.reset}`);
    console.log(`${cores.yellow}   Gere uma chave aleatória: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"${cores.reset}\n`);
} else if (!JWT_SECRET || JWT_SECRET.length < 32) {
    console.log(`${cores.red}❌ ERRO: JWT_SECRET muito curto (${JWT_SECRET?.length || 0} caracteres, mínimo 32)${cores.reset}\n`);
} else {
    console.log(`${cores.green}✅ JWT_SECRET seguro${cores.reset}\n`);
}

// Teste 3: Teste de Validação de Entrada - Cadastro vazio
console.log(`${cores.yellow}[TESTE 3] Testando validação de entrada (cadastro vazio)...${cores.reset}`);

const testarCadastroVazio = () => {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/auth/cadastrar',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            if (res.statusCode === 400 || res.statusCode === 422) {
                console.log(`${cores.green}✅ Servidor rejeitou cadastro vazio (HTTP ${res.statusCode})${cores.reset}\n`);
            } else if (res.statusCode === 201) {
                console.log(`${cores.red}❌ ERRO: Servidor aceitou cadastro vazio (HTTP 201)${cores.reset}`);
                console.log(`${cores.yellow}   Resposta: ${data}${cores.reset}\n`);
            } else {
                console.log(`${cores.yellow}⚠️ Status inesperado: HTTP ${res.statusCode}${cores.reset}\n`);
            }
        });
    });

    req.on('error', (e) => {
        console.log(`${cores.red}❌ Erro na conexão: ${e.message}${cores.reset}`);
        console.log(`${cores.yellow}   O servidor está rodando em localhost:3000?${cores.reset}\n`);
    });

    req.write(JSON.stringify({})); // Body vazio
    req.end();
};

testarCadastroVazio();

// Teste 4: Teste de SQL Injection
console.log(`${cores.yellow}[TESTE 4] Testando SQL Injection potencial...${cores.reset}`);
console.log(`${cores.yellow}   Tente atualizar funcionário com payload: {"campo' OR '1'='1": "valor"}${cores.reset}`);
console.log(`${cores.yellow}   Se funcionar, há vulnerabilidade de SQL Injection${cores.reset}\n`);

// Teste 5: Verificar se servidor roda sem BD
console.log(`${cores.yellow}[TESTE 5] Verificando se servidor roda sem banco de dados...${cores.reset}`);
console.log(`${cores.yellow}   Se o servidor iniciar sem BD, há risco de False Positive${cores.reset}\n`);

console.log(`${cores.blue}📌 Testes Completos!${cores.reset}`);
