import { URL_BASE_API, TEMPO_LIMITE_API_MS } from '../config/env';
import { obterTokenAutenticacao } from './sessionService';
import { API_FIELDS } from '../config/apiContract';

const CABECALHOS_PADRAO = {
    'Content-Type': 'application/json',
};

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

export async function requisicao(caminho, { metodo = 'GET', cabecalhos = {}, corpo, tempoLimiteMs = TEMPO_LIMITE_API_MS } = {}) {
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
        ? (corpo ? JSON.stringify(corpo) : undefined)
        : corpo;

    try {
        const resposta = await fetch(`${URL_BASE_API}${caminho}`, {
            method: metodo,
            headers: cabecalhosFinais,
            body: corpoSerializado,
            signal: controlador.signal,
        });

        const tipoConteudo = resposta.headers.get('content-type') || '';
        const carga = tipoConteudo.includes('application/json')
            ? await resposta.json()
            : await resposta.text();

        if (!resposta.ok) {
            const mensagem = typeof carga === 'string' && carga
                ? carga
                : carga?.message || 'Erro ao processar requisicao';
            throw new Error(mensagem);
        }

        return extrairCargaApi(carga);
    } finally {
        clearTimeout(idTempoLimite);
    }
}
