# Fluxo de testes — IPF Sistema

Guia passo a passo para testar a API **sem precisar ler o código**.  
Use o **VS Code** (ou Cursor) com a extensão **REST Client**.

---

## 1. O que você vai precisar

| Item | Para quê |
|------|----------|
| [Node.js](https://nodejs.org/) (versão LTS) | Rodar o servidor |
| VS Code ou Cursor | Editor |
| Extensão **REST Client** | Enviar os testes dos arquivos `.rest` |
| Banco MySQL configurado | O servidor só sobe se conectar no banco |
| Arquivo `.env` na pasta `Ipf` | Senha do banco e chave JWT |

### Instalar a extensão REST Client

1. Abra o VS Code/Cursor.
2. Vá em **Extensions** (ícone de quadrados na barra lateral).
3. Pesquise **REST Client** (autor: Huachao Mao).
4. Clique em **Install**.

---

## 2. Preparar o projeto (uma vez só)

### Passo 2.1 — Abrir a pasta certa

Abra no editor a pasta:

`IPF Sistema 3 - atual/Ipf`

(Essa pasta contém o arquivo `package.json`.)

### Passo 2.2 — Instalar dependências

Abra o terminal integrado (**Terminal → New Terminal**) e execute:

```bash
npm install
```

Aguarde terminar sem erro.

### Passo 2.3 — Criar o arquivo `.env`

1. Na pasta `Ipf`, copie o modelo:
   - Windows: copie `.env.example` e renomeie para `.env`
   - Ou no terminal: `copy .env.example .env`
2. Abra `.env` e preencha:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` — dados do seu MySQL
   - `JWT_SECRET` — chave longa e aleatória (mínimo 32 caracteres)

Para gerar uma chave segura, no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em `JWT_SECRET=`.

### Passo 2.4 — Banco de dados

Garanta que o MySQL está rodando e que as tabelas existem.  
Scripts de criação estão em `Ipf/database/` (se o time já passou o script, execute-o no MySQL).

### Passo 2.5 — Subir o servidor

No terminal, dentro da pasta `Ipf`:

```bash
npm start
```

**Sucesso** — você deve ver algo como:

- `✅ Configuração de ambiente validada`
- `✅ Conexão com o MySQL...`
- `🚀 Servidor da IPF Molduras rodando na porta 3000`

**Deixe esse terminal aberto** enquanto testa.

Se aparecer erro de configuração ou de banco, corrija o `.env` antes de continuar.

---

## 3. Como executar um teste no REST Client

1. Abra um arquivo `.rest` em `Ipf/src/tests/` (lista na seção 5).
2. Acima de cada bloco que começa com `GET`, `POST`, `PATCH` ou `DELETE`, aparece o link **Send Request**.
3. Clique em **Send Request**.
4. O resultado abre em uma aba ao lado (status **200**, **201**, etc. = em geral deu certo).

### Entender a resposta

| Código | Significado usual |
|--------|-------------------|
| **200** | OK — leitura ou atualização feita |
| **201** | Criado com sucesso |
| **400** | Dados inválidos no corpo da requisição |
| **401** | Não autenticado (token ausente ou inválido) |
| **403** | Sem permissão (ex.: usuário ainda não aprovado) |
| **404** | Recurso não encontrado |
| **409** | Conflito (ex.: e-mail já cadastrado) |
| **422** | Validação falhou (campos obrigatórios, formato) |
| **429** | Muitas tentativas — aguarde 1 minuto e tente de novo |

### Variáveis nos arquivos `.rest`

Linhas como `@token =` ou `@funcionario_id = 2` são **variáveis**.  
Você vai **preencher** `@token` e `@admin_token` depois do login (passo 4).

---

## 4. Fluxo completo (ordem obrigatória)

Siga **nesta ordem** na primeira vez. Depois pode repetir só os módulos que quiser.

---

### Etapa A — Servidor no ar

**Arquivo:** `src/tests/testeSistema.rest`

| # | Ação | O que clicar |
|---|------|----------------|
| A1 | Health check | `GET .../health` → **Send Request** |

**Esperado:** status **200** e mensagem de servidor operante.

---

### Etapa B — Autenticação (criar usuários e obter tokens)

**Arquivo:** `src/tests/testeAutenticacao.rest`

| # | Ação | Esperado |
|---|------|----------|
| B1 | **Criar primeiro Gerente** (`cadastrar-admin`) | **201** na primeira vez; **409** se o e-mail já existir |
| B2 | **Cadastro público** (`cadastrar`) | **201** — cria usuário **pendente** |
| B3 | **Login admin** | **200** — copie o campo `token` da resposta |
| B4 | Cole o token em `@admin_token =` no topo do arquivo (e também em `testeFuncionario.rest`) | |
| B5 | **Login usuário pendente** | **403** — normal antes da aprovação |
| B6 | (Opcional) Testes de erro: senha errada **401**, e-mail inválido **422** | |

**Como copiar o token**

1. Na resposta JSON do login, localize `"token": "eyJ..."`.
2. Copie **só** o valor entre aspas (sem a palavra `token`).
3. No topo do arquivo, altere `@admin_token =` para `@admin_token = eyJ...` (sem aspas extras).

Repita o mesmo para `@token` depois da Etapa C.

---

### Etapa C — Aprovar o funcionário (Gerente)

**Arquivo:** `src/tests/testeFuncionario.rest`

| # | Ação | Esperado |
|---|------|----------|
| C1 | **Listar funcionários** | **200** — lista com e-mails |
| C2 | Anote o `id` do usuário de teste (ex.: `teste.usuario@ipf.com`) e coloque em `@funcionario_id =` | |
| C3 | **Aprovar usuário** (`gerar-por-cargo` com cargo `Vendedor`) | **200** |
| C4 | Volte em `testeAutenticacao.rest` → **Login usuário aprovado** | **200** |
| C5 | Copie o `token` para `@token =` neste arquivo e nos outros que pedem token | |

---

### Etapa D — Leads

**Arquivo:** `src/tests/testeLeads.rest`

| # | Ação | Esperado |
|---|------|----------|
| D1 | Listar leads | **200** |
| D2 | Cadastrar lead | **201** (ou **400** se faltar telefone/e-mail) |

Anote o `id` do lead criado se for testar CRM/vendas em seguida (`@lead_id` nos outros arquivos).

---

### Etapa E — CRM (Kanban)

**Arquivo:** `src/tests/crm_comercial_api_test.rest`

| # | Ação | Esperado |
|---|------|----------|
| E1 | Listar cards | **200** |
| E2 | Criar card (use um `@lead_id` que exista) | **201** |
| E3 | Atualizar card | **200** |
| E4 | Marcar ganho / perdido | **200** (conforme regras do negócio) |

Ajuste `@id_do_card` com um ID real da listagem.

---

### Etapa F — Vendas

**Arquivo:** `src/tests/testeVendas.rest`

| # | Ação | Esperado |
|---|------|----------|
| F1 | Listar vendas | **200** |
| F2 | Converter lead | **201** ou **400** (depende do lead e permissões) |

---

### Etapa G — Produção

**Arquivo:** `src/tests/testeProducao.rest`

Requer usuário com permissão de **produção** (cargo/permissões diferentes de Vendedor).  
Se usar só o vendedor de teste, pode receber **403**.

| # | Ação | Esperado |
|---|------|----------|
| G1 | Fila de produção | **200** ou **403** |
| G2 | Avançar pedido (`@pedido_id` existente) | **200** ou **403** |

---

### Etapa H — Matriz (Arquitetura)

**Arquivo:** `src/tests/testeMatriz.rest`

Mesma observação: precisa de módulo **arquitetura** no token.

| # | Ação | Esperado |
|---|------|----------|
| H1 | Status da matriz | **200** ou **403** |

---

### Etapa I — Notificações

**Arquivo:** `src/tests/notificacoes_com_api_test.rest`

| # | Ação | Esperado |
|---|------|----------|
| I1 | Processar atrasos | **200** |
| I2 | Listar notificações do funcionário | **200** |
| I3 | Marcar como lida / marcar todas | **200** |

Use `@funcionario_id` igual ao da Etapa C.

---

## 5. Mapa dos arquivos de teste

| Arquivo | O que testa |
|---------|-------------|
| `testeSistema.rest` | Saúde do servidor |
| `testeAutenticacao.rest` | Login, cadastro, senha |
| `testeFuncionario.rest` | Funcionários e permissões |
| `testeLeads.rest` | Leads |
| `crm_comercial_api_test.rest` | CRM / Kanban |
| `testeVendas.rest` | Vendas |
| `testeProducao.rest` | Produção |
| `testeMatriz.rest` | Matriz |
| `notificacoes_com_api_test.rest` | Notificações |
| `crm_api_test.rest` | **Não usar** — obsoleto; use `crm_comercial_api_test.rest` |

---

## 6. Teste automático (opcional)

Com o servidor rodando, em **outro** terminal na pasta `Ipf`:

```bash
node src/tests/testarEndpoints.js
```

O script percorre vários endpoints e mostra ✅ ou ❌ no terminal.  
Não substitui o REST Client, mas ajuda a validar rápido.

Para checar só variáveis de ambiente e JWT:

```bash
node src/tests/validacao_test.js
```

---

## 7. Problemas comuns

### “Muitas requisições” (429)

O sistema limita tentativas de login/cadastro. **Aguarde 1 minuto** e tente de novo.

### Login do usuário de teste sempre 403

O usuário ainda não foi aprovado. Faça a **Etapa C** antes do login final.

### Token não funciona (401)

- Token **expirado** (válido por ~1 hora) — faça login de novo.
- Esqueceu o prefixo na requisição: o header deve ser `Authorization: Bearer SEU_TOKEN`.

### Servidor não inicia

- Revise `.env` (principalmente `JWT_SECRET` com 32+ caracteres).
- Confirme MySQL acessível com os dados do `.env`.

### CRM não cria card

- `lead_id` precisa existir (crie um lead na Etapa D).
- Use `@token` de usuário com módulo vendas.

---

## 8. Checklist rápido (primeira execução)

- [ ] `npm install` executado
- [ ] `.env` preenchido (banco + JWT_SECRET)
- [ ] `npm start` rodando sem erro
- [ ] `testeSistema.rest` → health **200**
- [ ] `testeAutenticacao.rest` → admin criado e `@admin_token` preenchido
- [ ] `testeFuncionario.rest` → usuário aprovado
- [ ] `testeAutenticacao.rest` → login usuário e `@token` preenchido
- [ ] Demais arquivos testados na ordem D → I

---

## 9. Contato

Dúvidas sobre credenciais de banco ou ambiente: fale com o responsável técnico do projeto (WhatsApp indicado no `README.md`).
