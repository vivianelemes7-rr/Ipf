import { DEVE_USAR_MOCKS } from '../config/env';
import { requisicao } from './httpClient';
import { limparSessao, persistirSessao } from './sessionService';

function normalizarCargaAutenticacao(carga, papelPadrao) {
    const token = carga?.token || carga?.accessToken || '';
    const usuario = carga?.user || {
        id: carga?.userId || 'local-user',
        name: carga?.name || 'Usuario',
        email: carga?.email || '',
        role: carga?.role || papelPadrao,
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
        const idUsuarioMock = emailNormalizado || 'mock-user';
        const sessaoMock = {
            token: 'mock-token',
            usuario: {
                id: idUsuarioMock,
                name: email?.split('@')[0] || 'Usuario',
                email: emailNormalizado,
                role: papel,
            },
            papel,
        };

        persistirSessao(sessaoMock);
        return sessaoMock;
    }

    const cargaApi = await requisicao('/auth/login', {
        metodo: 'POST',
        corpo: { email, password: senha, role: papel },
    });

    const sessao = normalizarCargaAutenticacao(cargaApi, papel);
    persistirSessao(sessao);
    return sessao;
}

export function sair() {
    limparSessao();
}
