import { DEVE_USAR_MOCKS } from '../config/env';
import { requisicao } from './httpClient';
import { limparSessao, persistirSessao } from './sessionService';
import { encontrarFuncionarioPorCredenciais } from './funcionarioService';
import { API_ENDPOINTS, API_FIELDS } from '../config/apiContract';

function normalizarCargaAutenticacao(carga, papelPadrao) {
    const token = carga?.[API_FIELDS.authResponse.token]
        || carga?.[API_FIELDS.authResponse.accessToken]
        || '';
    const usuario = carga?.[API_FIELDS.authResponse.user] || {
        id: carga?.[API_FIELDS.authResponse.userId] || 'local-user',
        name: carga?.[API_FIELDS.authResponse.name] || 'Usuario',
        email: carga?.[API_FIELDS.authResponse.email] || '',
        role: carga?.[API_FIELDS.authResponse.role] || papelPadrao,
    };

    return {
        token,
        usuario,
        papel: usuario.role || papelPadrao,
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
    persistirSessao(sessao);
    return sessao;
}

export function sair() {
    limparSessao();
}
