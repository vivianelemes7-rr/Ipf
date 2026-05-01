# Projeto IPF

Aplicacao React com Vite.

## Executar o projeto

```bash
npm install
npm run dev
```

## Preparacao para integracao com back-end

Foi criada uma camada de servicos para permitir troca entre mock e API real sem alterar os componentes.

Arquivos principais:

- `src/config/env.js`: configura modo de dados e URL base
- `src/services/httpClient.js`: cliente HTTP centralizado
- `src/services/sessionService.js`: persistencia de token e usuario logado
- `src/services/authService.js`: login/logout e normalizacao de payload de autenticacao
- `src/services/kanbanService.js`: servico da tela de Kanban
- `src/config/roles.js`: regras de acesso por perfil em um unico ponto
- `src/mocks/kanbanMock.js`: dados simulados e contratos iniciais

## Variaveis de ambiente

Use o arquivo `.env.example` como base:

```bash
VITE_API_MODE=mock
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT_MS=10000
```

### Modos

- `VITE_API_MODE=mock`: usa dados locais simulados
- `VITE_API_MODE=api`: tenta API real e faz fallback para mock se a API falhar

## Como integrar quando o back estiver pronto

1. Definir `VITE_API_MODE=api` no `.env`.
2. Implementar endpoint `POST /auth/login` retornando:

```json
{
	"token": "jwt-ou-access-token",
	"user": {
		"id": "id-do-usuario",
		"name": "Nome",
		"email": "email@empresa.com",
		"role": "administrador"
	}
}
```

3. Implementar endpoint `GET /kanban/boards` retornando um destes formatos:

```json
{ "boards": { "arquitetura": { "key": "arquitetura", "title": "...", "columns": [], "cards": [] } } }
```

ou

```json
[{ "key": "arquitetura", "title": "...", "columns": [], "cards": [] }]
```

4. Implementar endpoint `PATCH /kanban/boards/:boardKey/cards/:cardId` com body `{ "columnId": "novo-status" }`.
5. Quando o ambiente estiver estavel, remover fallback para mocks em `src/services/kanbanService.js`.
