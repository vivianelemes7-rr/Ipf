# 🔍 RELATÓRIO DE ERROS E PROBLEMAS ENCONTRADOS

**Data:** 13 de maio de 2026  
**Projeto:** IPF - CRM Sistema

---

## ✅ PROBLEMAS RESOLVIDOS

### 1. **Dependências Faltando** ✓ RESOLVIDO
- **Problema:** `bcryptjs@^3.0.3` e `jsonwebtoken@^9.0.3` não estavam instalados
- **Erro:** `npm error missing: bcryptjs@^3.0.3, required by ipf@`
- **Solução:** Executado `npm install --legacy-peer-deps`
- **Status:** ✅ Instalado com sucesso

---

## ⚠️ ERROS CRÍTICOS ENCONTRADOS

### 1. **Validação de Entrada - Cadastro de Funcionário**
**Arquivo:** [src/controllers/autenticacaoController.js](src/controllers/autenticacaoController.js#L6)  
**Linha:** 6-13

```javascript
async cadastrar(req, res, next) {
    const { nome, email, cargo, departamento, permissoes } = req.body;
    const senhaFinal = req.body.password || req.body.senha;
```

**Problema:** Não há validação de campos obrigatórios
- `nome` pode ser vazio ou undefined
- `email` não é validado (formato, duplicidade)
- `cargo` pode ser inválido
- `departamento` pode ser vazio
- `senhaFinal` pode ser undefined se ambos `password` e `senha` forem nulos

**Risco:** 🔴 ALTO - Registros inválidos no banco de dados

---

### 2. **SQL Injection em Queries Dinâmicas**
**Arquivo:** [src/models/funcionarioModel.js](src/models/funcionarioModel.js#L42)  
**Linhas:** 42-44, 49-51

```javascript
async atualizarFuncionario(id, dados) {
    const campos = Object.keys(dados).map(c => `${c} = ?`).join(', ');
    const [res] = await conexao.query(`UPDATE funcionarios SET ${campos} WHERE id = ?`, [...Object.values(dados), id]);
```

**Problema:** Os nomes dos campos são interpolados diretamente
- Um atacante pode enviar `{"__proto__": "hacked"}` ou campos inválidos
- Sem validação de whitelist

**Risco:** 🔴 ALTO - Injeção SQL, manipulação de estrutura

**Solução Recomendada:**
```javascript
const camposValidos = ['nome', 'email', 'cargo', 'departamento', 'status_ativo'];
const campos = Object.keys(dados)
    .filter(c => camposValidos.includes(c))
    .map(c => `${c} = ?`)
    .join(', ');
```

---

### 3. **Segurança JWT - Chave Padrão Insegura**
**Arquivo:** [src/services/autenticacaoService.js](src/services/autenticacaoService.js#L11)  
**Linha:** 11

```javascript
gerarToken(u) {
    return jwt.sign({ ... }, process.env.JWT_SECRET || 'chave_mestra_ipf_2026', { expiresIn: '1h' });
}
```

**Problema:** 
- Se `JWT_SECRET` não estiver definido no `.env`, usa uma chave hardcoded conhecida
- Qualquer pessoa pode falsificar tokens
- A chave está visível no repositório Git

**Risco:** 🔴 CRÍTICO - Autenticação comprometida

**Solução:** Obrigar `JWT_SECRET` e gerar erro se não estiver configurado:
```javascript
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado no arquivo .env');
}
```

---

### 4. **Arquivo .env Faltando**
**Problema:** Não existe arquivo `.env` no repositório
- Variáveis de ambiente obrigatórias: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`
- Servidor pode iniciar sem banco de dados (vide [server.js](server.js#L17))

**Risco:** 🔴 ALTO - Falha silenciosa, servidor sem dados

---

### 5. **Tratamento de Erro Genérico Demais**
**Arquivo:** [src/controllers/autenticacaoController.js](src/controllers/autenticacaoController.js#L14)  
**Linha:** 14

```javascript
} catch (erro) { next(erro); }
```

**Problema:** Não há logging específico antes de passar o erro
- Erros de banco de dados não são diferenciados
- Difícil debugar em produção

**Risco:** 🟡 MÉDIO - Dificuldade na manutenção

---

### 6. **Falta de Validação de Token no Middleware**
**Arquivo:** [src/middlewares/autorizacaoMiddleware.js](src/middlewares/autorizacaoMiddleware.js#L4)  
**Linha:** 4

```javascript
const auth = req.headers.authorization;
if (!auth) return res.status(401).json({ erro: 'Sem token' });
```

**Problema:**
- Não valida formato do token (`Bearer <token>`)
- Se o token não tiver o espaço, o `split(' ')[1]` retorna undefined
- Nenhum tratamento para headers malformados

**Risco:** 🟡 MÉDIO - Autenticação pode falhar silenciosamente

---

### 7. **Vulnerabilidade de Negação de Serviço (DoS)**
**Arquivo:** [src/services/autenticacaoService.js](src/services/autenticacaoService.js#L4)  
**Linha:** 4

```javascript
async criptografarSenha(senha) { return await bcrypt.hash(senha, 10); }
```

**Problema:**
- `bcrypt` com 10 rounds é lento
- Se enviarem uma senha muito longa, pode causar travamento
- Sem limite de tamanho de entrada

**Risco:** 🟡 MÉDIO - Possível DoS

**Solução:**
```javascript
if (!senha || senha.length > 128) {
    throw new Error('Senha inválida (máximo 128 caracteres)');
}
```

---

### 8. **Ausência de Validação de Permissões Incompleta**
**Arquivo:** [src/middlewares/autorizacaoMiddleware.js](src/middlewares/autorizacaoMiddleware.js#L9)  
**Linha:** 9

```javascript
if (dec.cargo === 'Gerente') return next();
```

**Problema:**
- Gerentes têm acesso total, sem exceções
- Outras rotas podem não ter proteção

**Risco:** 🟡 MÉDIO - Autorização fraca

---

### 9. **SQL Query sem Proteção contra NULL**
**Arquivo:** [src/models/autenticacaoModel.js](src/models/autenticacaoModel.js#L14)  
**Linha:** 14

```javascript
const user = await AutenticacaoModel.buscarPorEmailParaLogin(email);

if (!user || !(await AutenticacaoService.compararSenha(senhaFinal, user.senha))) {
```

**Problema:** Se `email` for NULL ou undefined, a query pode retornar comportamento inesperado

**Risco:** 🟡 MÉDIO - Erro em tempo de execução

---

### 10. **Servidor Continua Funcionando Sem Banco de Dados**
**Arquivo:** [server.js](server.js#L17)  
**Linha:** 17-22

```javascript
.catch(err => {
    // Mesmo com erro no banco, vamos subir o servidor
    app.listen(PORT, () => {
        console.log(`⚠️ Servidor rodando na porta ${PORT} (SEM BANCO DE DADOS)`);
    });
});
```

**Problema:**
- Servidor aceita requisições mas falha silenciosamente ao executar
- Usuário não sabe que não há dados

**Risco:** 🔴 ALTO - False Positive de funcionamento

---

## 📋 OUTRAS QUESTÕES

### 11. **Falta de Tratamento de Timeout**
- Conexão com MySQL Aiven pode ter timeout
- Sem retry logic

### 12. **Falta de Rate Limiting**
- Login pode sofrer brute force
- Sem proteção

### 13. **Sem Hash de Email**
- Email armazenado em plain text
- Possível GDPR violation

### 14. **Sem Auditoria de Ações**
- Não registra quem fez o quê
- Impossível rastrear mudanças

---

## 🛠️ PLANO DE CORREÇÃO

| Prioridade | Erro | Ação |
|------------|------|------|
| 🔴 CRÍTICA | JWT Secret padrão inseguro | Validar em startup |
| 🔴 CRÍTICA | SQL Injection | Whitelist de campos |
| 🔴 ALTA | Validação de entrada | Implementar schema validation |
| 🟡 MÉDIA | Servidor sem BD | Rejeitar startup |
| 🟡 MÉDIA | Middleware autenticação | Melhorar parsing |

---

## 📌 PRÓXIMOS PASSOS

1. ✅ Instalar dependências faltantes
2. ⏳ Criar arquivo `.env.example` 
3. ⏳ Validar entrada em todos os endpoints
4. ⏳ Proteger queries dinâmicas
5. ⏳ Adicionar rate limiting
6. ⏳ Melhorar logging

