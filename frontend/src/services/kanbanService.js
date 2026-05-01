import { CONFIGURACOES_QUADRO, VENDEDORES_PADRAO } from '../mocks/kanbanMock';
import { QUADRO_PADRAO_POR_PAPEL } from '../config/roles';
import { DEVE_USAR_MOCKS } from '../config/env';
import { requisicao } from './httpClient';

function comVendedoresPadrao(configuracoesQuadro) {
    return Object.fromEntries(
        Object.entries(configuracoesQuadro).map(([chave, configuracao]) => [
            chave,
            {
                ...configuracao,
                cards: (configuracao.cards || []).map((card, indice) => ({
                    ...card,
                    seller: card.seller || VENDEDORES_PADRAO[indice % VENDEDORES_PADRAO.length],
                })),
            },
        ])
    );
}

function obterQuadrosMock() {
    return comVendedoresPadrao(CONFIGURACOES_QUADRO);
}

function normalizarColecaoQuadros(carga) {
    if (!carga) return {};

    if (carga.boards && typeof carga.boards === 'object' && !Array.isArray(carga.boards)) {
        return carga.boards;
    }

    if (Array.isArray(carga.boards)) {
        return Object.fromEntries(carga.boards.map((quadro) => [quadro.key, quadro]));
    }

    if (Array.isArray(carga)) {
        return Object.fromEntries(carga.map((quadro) => [quadro.key, quadro]));
    }

    if (typeof carga === 'object') {
        return carga;
    }

    return {};
}

function garantirChavesQuadro(configuracoesQuadro) {
    const chaveQuadroPadrao = QUADRO_PADRAO_POR_PAPEL.administrador;
    if (configuracoesQuadro[chaveQuadroPadrao]) {
        return configuracoesQuadro;
    }

    const primeiraChaveQuadro = Object.keys(configuracoesQuadro)[0];
    if (!primeiraChaveQuadro) {
        return configuracoesQuadro;
    }

    return {
        ...configuracoesQuadro,
        [chaveQuadroPadrao]: configuracoesQuadro[primeiraChaveQuadro],
    };
}

export async function listarQuadrosKanban() {
    if (DEVE_USAR_MOCKS) {
        return obterQuadrosMock();
    }

    try {
        const quadrosApi = await requisicao('/kanban/boards');
        const quadrosNormalizados = normalizarColecaoQuadros(quadrosApi);
        return comVendedoresPadrao(garantirChavesQuadro(quadrosNormalizados));
    } catch (erro) {
        console.warn('Falha ao carregar API de kanban. Aplicando mocks:', erro);
        return obterQuadrosMock();
    }
}

export async function atualizarColunaCardKanban(chaveQuadro, idCard, idColuna, metadados = {}) {
    if (DEVE_USAR_MOCKS) {
        return { success: true };
    }

    try {
        return await requisicao(`/kanban/boards/${chaveQuadro}/cards/${idCard}`, {
            metodo: 'PATCH',
            corpo: {
                columnId: idColuna,
                ...metadados,
            },
        });
    } catch (erro) {
        console.warn('Falha ao salvar movimentacao do card na API:', erro);
        return { success: false, message: erro.message };
    }
}

export async function criarCardKanban(chaveQuadro, card) {
    if (DEVE_USAR_MOCKS) {
        return { success: true, card };
    }

    try {
        return await requisicao(`/kanban/boards/${chaveQuadro}/cards`, {
            metodo: 'POST',
            corpo: card,
        });
    } catch (erro) {
        console.warn('Falha ao criar card na API:', erro);
        return { success: false, message: erro.message };
    }
}
