import { DEVE_USAR_MOCKS } from '../config/env';
import { requisicao } from './httpClient';
import { limparSessao, persistirSessao } from './sessionService';
import { encontrarFuncionarioPorCredenciais } from './funcionarioService';
import { API_ENDPOINTS, API_FIELDS } from '../config/apiContract';

function normalizarCargaAutenticacao(carga, papelPadrao) {
const token =
carga?.[API_FIELDS.authResponse.token] ||
carga?.[API_FIELDS.authResponse.accessToken] ||
carga?.token ||
carga?.accessToken ||
'';
const usuario = carga?.[API_FIELDS.authResponse.user] || carga?.user || {
id: 
carga?.[API_FIELDS.authResponse.userId] ||
carga?.userId ||
carga?.id ||
'local-user',
name:
carga?.[API_FIELDS.authResponse.name] ||
carga?.nome ||
carga?.name ||
'Usuario',
email:
carga?.[API_FIELDS.authResponse.email] ||
carga?.email ||
'',
role:
carga?.[API_FIELDS.authResponse.role] ||
carga?.role ||
papelPadrao,
};

return {
token,
usuario,
papel: usuario.role || carga?.role || papelPadrao,
};
}
export async function autenticar({ email, senha, papel }) {
if (DEVE_USAR_MOCKS) {
const emailNormalizado = (email || '').trim().toLowerCase();
const funcionario = encontrarFuncionarioPorCredenciais(emailNormalizado, senha);
const papelSessao = funcionario?.papel || papel;
const sessaoMock = {
token: 'mock-token',
usuario: {
id: funcionario?.id || emailNormalizado || 'mock-user',
name: funcionario?.nome || email?.split('@')[0] || 'Usuario',
email: emailNormalizado,
role: papelSessao,
},
papel: papelSessao,
};

persistirSessao(sessaoMock);
return sessaoMock;
}
const cargaApi = await requisicao(API_ENDPOINTS.auth.login, {
metodo: 'POST',
corpo: {
[API_FIELDS.authRequest.email]: email,
[API_FIELDS.authRequest.password]: senha,
[API_FIELDS.authRequest.role]: papel,
},
});
const sessao = normalizarCargaAutenticacao(cargaApi, papel);
if (!sessao.token) {
throw new Error('Login realizado, mas o back não retornou o token.');
}
persistirSessao(sessao);
return sessao;
}
export function sair() {
limparSessao();
}
