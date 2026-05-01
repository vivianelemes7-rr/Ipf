import { URL_BASE_API, TEMPO_LIMITE_API_MS } from '../config/env';
import { obterTokenAutenticacao } from './sessionService';

const CABECALHOS_PADRAO = {
    'Content-Type': 'application/json',
};

export async function requisicao(caminho, { metodo = 'GET', cabecalhos = {}, corpo, tempoLimiteMs = TEMPO_LIMITE_API_MS } = {}) {
    const controlador = new AbortController();
    const idTempoLimite = setTimeout(() => controlador.abort(), tempoLimiteMs);

    const token = obterTokenAutenticacao();
    const cabecalhosFinais = {
        ...CABECALHOS_PADRAO,
        ...cabecalhos,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
        const resposta = await fetch(`${URL_BASE_API}${caminho}`, {
            method: metodo,
            headers: cabecalhosFinais,
            body: corpo ? JSON.stringify(corpo) : undefined,
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

        return carga;
    } finally {
        clearTimeout(idTempoLimite);
    }
}
