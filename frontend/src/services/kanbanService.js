import { CONFIGURACOES_QUADRO, VENDEDORES_PADRAO } from '../mocks/kanbanMock';
import { QUADRO_PADRAO_POR_PAPEL } from '../config/roles';
import { DEVE_USAR_MOCKS } from '../config/env';
import { requisicao } from './httpClient';
import { API_ENDPOINTS, API_FIELDS } from '../config/apiContract';

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

/**
 * Normaliza a resposta da API do Kanban unificado.
 * O backend retorna { boards: { vendedor: {...}, arquitetura: {...}, ... } }
 * O frontend espera um objeto keyed por chave do quadro.
 */
function normalizarColecaoQuadros(carga) {
    if (!carga) return {};

    // Formato esperado: { boards: { ... } }
    const chaveBoards = API_FIELDS.commonEnvelope.boards;
    if (carga[chaveBoards] && typeof carga[chaveBoards] === 'object' && !Array.isArray(carga[chaveBoards])) {
        return carga[chaveBoards];
    }

    // Formato array de quadros
    if (Array.isArray(carga[chaveBoards])) {
        return Object.fromEntries(carga[chaveBoards].map((quadro) => [quadro[API_FIELDS.board.key], quadro]));
    }

    if (Array.isArray(carga)) {
        return Object.fromEntries(carga.map((quadro) => [quadro[API_FIELDS.board.key], quadro]));
    }

    // Objeto direto já no formato correto
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
        const quadrosApi = await requisicao(API_ENDPOINTS.kanban.boards);
        const quadrosNormalizados = normalizarColecaoQuadros(quadrosApi);
        return comVendedoresPadrao(garantirChavesQuadro(quadrosNormalizados));
    } catch (erro) {
        console.warn('Falha ao carregar API de kanban:', erro);
        throw erro;
    }
}

export async function atualizarColunaCardKanban(chaveQuadro, idCard, idColuna, metadados = {}) {
    if (DEVE_USAR_MOCKS) {
        return { success: true };
    }

    try {
        return await requisicao(API_ENDPOINTS.kanban.boardCard(chaveQuadro, idCard), {
            metodo: 'PATCH',
            corpo: {
                [API_FIELDS.card.columnId]: idColuna,
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
        return await requisicao(API_ENDPOINTS.kanban.boardCards(chaveQuadro), {
            metodo: 'POST',
            corpo: card,
        });
    } catch (erro) {
        console.warn('Falha ao criar card na API:', erro);
        return { success: false, message: erro.message };
    }
}

export async function atualizarCardKanban(chaveQuadro, idCard, dadosCard) {
    if (DEVE_USAR_MOCKS) {
        return { success: true, card: { id: idCard, ...dadosCard } };
    }

    try {
        return await requisicao(API_ENDPOINTS.kanban.boardCard(chaveQuadro, idCard), {
            metodo: 'PATCH',
            corpo: dadosCard,
        });
    } catch (erro) {
        console.warn('Falha ao atualizar card na API:', erro);
        return { success: false, message: erro.message };
    }
}

export async function excluirCardKanban(chaveQuadro, idCard) {
    if (DEVE_USAR_MOCKS) {
        return { success: true };
    }

    try {
        return await requisicao(API_ENDPOINTS.kanban.boardCard(chaveQuadro, idCard), {
            metodo: 'DELETE',
        });
    } catch (erro) {
        console.warn('Falha ao excluir card na API:', erro);
        return { success: false, message: erro.message };
    }
}
