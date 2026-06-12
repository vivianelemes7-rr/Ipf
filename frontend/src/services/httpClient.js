import { URL_BASE_API, TEMPO_LIMITE_API_MS } from '../config/env';
import { limparSessao, obterTokenAutenticacao } from './sessionService';
import { API_FIELDS } from '../config/apiContract';

const CABECALHOS_PADRAO = {
    'Content-Type': 'application/json',
};

export class ApiError extends Error {
    constructor(message, { status = 0, payload = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

function deveSerializarComoJson(corpo) {
    return corpo && !(corpo instanceof FormData);
}

function removerCabecalhoContentType(cabecalhos) {
    return Object.fromEntries(
        Object.entries(cabecalhos).filter(([chave]) => chave.toLowerCase() !== 'content-type')
    );
}

function extrairCargaApi(carga) {
    if (!carga || typeof carga !== 'object' || Array.isArray(carga)) {
        return carga;
    }

    const chaveData = API_FIELDS.commonEnvelope.data;
    if (Object.prototype.hasOwnProperty.call(carga, chaveData)) {
        return carga[chaveData];
    }

    return carga;
}

function normalizarUrlBase(urlBase) {
    return urlBase.endsWith('/') ? urlBase.slice(0, -1) : urlBase;
}

function normalizarCaminho(caminho) {
    if (!caminho) return '';
    return caminho.startsWith('/') ? caminho : `/${caminho}`;
}

function montarQueryString(query = {}) {
    const entradas = Object.entries(query).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '');
    if (!entradas.length) return '';

    const parametros = new URLSearchParams();
    entradas.forEach(([chave, valor]) => {
        if (Array.isArray(valor)) {
            valor.forEach((item) => parametros.append(chave, String(item)));
            return;
        }

        parametros.append(chave, String(valor));
    });

    return `?${parametros.toString()}`;
}

function montarUrl(caminho, query) {
    return `${normalizarUrlBase(URL_BASE_API)}${normalizarCaminho(caminho)}${montarQueryString(query)}`;
}

async function lerCargaResposta(resposta) {
    if (resposta.status === 204) {
        return null;
    }

    const tipoConteudo = resposta.headers.get('content-type') || '';
    if (tipoConteudo.includes('application/json')) {
        return await resposta.json();
    }

    const texto = await resposta.text();
    return texto || null;
}

function mensagemErroApi(carga) {
    if (!carga) {
        return 'Erro ao processar requisição';
    }

    if (typeof carga === 'string') {
        return carga;
    }

    if (Array.isArray(carga.erros) && carga.erros.length > 0) {
        return carga.erros.join(' ');
    }

    if (Array.isArray(carga.errors) && carga.errors.length > 0) {
        return carga.errors.join(' ');
    }

    return (
        carga.mensagem ||
        carga.message ||
        carga.erro ||
        carga.error ||
        'Erro ao processar requisição'
    );
}

function deveTratarComoSessaoExpirada(status, mensagem = '') {
    if (status !== 401) {
        return false;
    }

    const texto = mensagem.toLowerCase();

    return (
        texto.includes('token') ||
        texto.includes('sessão') ||
        texto.includes('sessao') ||
        texto.includes('expirou') ||
        texto.includes('não autorizado') ||
        texto.includes('nao autorizado')
    );
}

function tratarSessaoExpirada(status, mensagem) {
    if (!deveTratarComoSessaoExpirada(status, mensagem)) {
        return;
    }

    limparSessao();
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ipf:auth:expired'));
    }
}

export async function requisicao(caminho, { metodo = 'GET', cabecalhos = {}, corpo, query, tempoLimiteMs = TEMPO_LIMITE_API_MS } = {}) {
    const controlador = new AbortController();
    const idTempoLimite = setTimeout(() => controlador.abort(), tempoLimiteMs);

    const token = obterTokenAutenticacao();
    const cabecalhosBase = deveSerializarComoJson(corpo)
        ? CABECALHOS_PADRAO
        : removerCabecalhoContentType(CABECALHOS_PADRAO);

    const cabecalhosFinais = {
        ...cabecalhosBase,
        ...cabecalhos,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const corpoSerializado = deveSerializarComoJson(corpo)
        ? JSON.stringify(corpo)
        : corpo;

    try {
        const resposta = await fetch(montarUrl(caminho, query), {
            method: metodo,
            headers: cabecalhosFinais,
            body: corpoSerializado,
            signal: controlador.signal,
        });

        const carga = await lerCargaResposta(resposta);

        if (!resposta.ok) {
            const mensagemErro = mensagemErroApi(carga);

            tratarSessaoExpirada(resposta.status, mensagemErro);

            throw new ApiError(mensagemErro, {
                status: resposta.status,
                payload: carga,
            });
        }

        return extrairCargaApi(carga);
    } catch (erro) {
        if (erro?.name === 'AbortError') {
            throw new ApiError('Tempo limite da requisição excedido.', { status: 408 });
        }

        if (erro instanceof ApiError) {
            throw erro;
        }

        throw new ApiError(erro?.message || 'Falha de comunicação com o servidor.');
    } finally {
        clearTimeout(idTempoLimite);
    }
}
