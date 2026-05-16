
# 🐛 GUIA DE CORREÇÃO DOS ERROS ENCONTRADOS

## 1️⃣ PROBLEMA: Validação de Entrada Faltando

**Onde:** [src/controllers/autenticacaoController.js](../src/controllers/autenticacaoController.js)

### ✅ Solução:

```javascript
const { validarCadastroFuncionario } = require('../middlewares/validacaoMiddleware');

// Em autenticacaoRoutes.js
router.post('/cadastrar', validarCadastroFuncionario, AutenticacaoController.cadastrar);
```

---

## 2️⃣ PROBLEMA: SQL Injection em Queries Dinâmicas

**Onde:** [src/models/funcionarioModel.js](../src/models/funcionarioModel.js) (linhas 42-51)

### ✅ Solução:

**ANTES:**
```javascript
async atualizarFuncionario(id, dados) {
    const campos = Object.keys(dados).map(c => `${c} = ?`).join(', ');
    const [res] = await conexao.query(`UPDATE funcionarios SET ${campos} WHERE id = ?`, 
        [...Object.values(dados), id]);
}
```

**DEPOIS:**
```javascript
async atualizarFuncionario(id, dados) {
    const camposValidos = ['nome', 'email', 'cargo', 'departamento', 'status_ativo'];
    const campos = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => `${c} = ?`)
        .join(', ');
    
    if (campos.length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
    }

    const valores = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => dados[c]);
    
    const [res] = await conexao.query(
        `UPDATE funcionarios SET ${campos} WHERE id = ?`, 
        [...valores, id]
    );
    return res.affectedRows;
}
```

---

## 3️⃣ PROBLEMA: JWT_SECRET Inseguro

**Onde:** [src/services/autenticacaoService.js](../src/services/autenticacaoService.js)

### ✅ Solução:

**ANTES:**
```javascript
gerarToken(u) {
    return jwt.sign({ ... }, process.env.JWT_SECRET || 'chave_mestra_ipf_2026', { expiresIn: '1h' });
}
```

**DEPOIS:**
```javascript
gerarToken(u) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET não configurado no arquivo .env');
    }
    return jwt.sign({ ... }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
```

**E em server.js (adicionar no startup):**
```javascript
const { validarConfiguracao } = require('./middlewares/validacaoMiddleware');

validarConfiguracao(); // Falha aqui se JWT_SECRET não estiver configurado
```

---

## 4️⃣ PROBLEMA: Arquivo .env Faltando

### ✅ Solução:

1. Copiar `.env.example` para `.env`
   ```bash
   cp .env.example .env
   ```

2. Gerar JWT_SECRET seguro:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. Configurar variáveis no `.env`

---

## 5️⃣ PROBLEMA: Servidor Roda Sem Banco de Dados

**Onde:** [server.js](../server.js)

### ✅ Solução:

**ANTES:**
```javascript
.catch(err => {
    app.listen(PORT, () => {
        console.log(`⚠️ Servidor rodando na porta ${PORT} (SEM BANCO DE DADOS)`);
    });
});
```

**DEPOIS:**
```javascript
.catch(err => {
    console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao banco de dados');
    console.error(err.message);
    process.exit(1); // Parar o processo
});
```

---

## 6️⃣ PROBLEMA: Middleware de Autenticação Fraco

**Onde:** [src/middlewares/autorizacaoMiddleware.js](../src/middlewares/autorizacaoMiddleware.js)

### ✅ Solução:

```javascript
const { verificarAcessoSeguro } = require('./validacaoMiddleware');

// Usar em vez de:
app.use('/vendas', verificarAcesso(['Vendedor'], 'modulo_vendas'));

// Usar:
app.use('/vendas', verificarAcessoSeguro(['Vendedor'], 'modulo_vendas'));
```

---

## 7️⃣ PROBLEMA: Falta de Rate Limiting

### ✅ Solução:

```javascript
const { rateLimit } = require('../middlewares/validacaoMiddleware');

router.post('/login', rateLimit(5, 60000), AutenticacaoController.login);
router.post('/cadastrar', rateLimit(3, 60000), validarCadastroFuncionario, AutenticacaoController.cadastrar);
```

---

## 8️⃣ PROBLEMA: Sem Logging Adequado

### ✅ Solução:

**Em autenticacaoController.js:**
```javascript
async cadastrar(req, res, next) {
    try {
        console.log(`[CADASTRO] Tentando registrar: ${req.body.email}`);
        // ... resto do código
        console.log(`[CADASTRO] ✅ Usuário registrado: ${req.body.email}`);
        res.status(201).json({ mensagem: "Usuário registrado com sucesso!" });
    } catch (erro) {
        console.error(`[CADASTRO] ❌ Erro ao registrar ${req.body.email}:`, erro.message);
        next(erro);
    }
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar arquivo `.env` com variáveis obrigatórias
- [ ] Instalar `validacaoMiddleware.js`
- [ ] Adicionar validação em cadastro/login
- [ ] Proteger queries dinâmicas contra SQL injection
- [ ] Validar JWT_SECRET no startup
- [ ] Parar servidor se BD não conectar
- [ ] Adicionar rate limiting em rotas sensíveis
- [ ] Melhorar logging
- [ ] Testar com `src/tests/validacao_test.js`

---

## 🧪 COMO EXECUTAR OS TESTES

```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2: Executar testes
node src/tests/validacao_test.js
```

