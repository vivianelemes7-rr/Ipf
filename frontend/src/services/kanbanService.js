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

function normalizarCardGerencial(card) {
    if (!card) return null;

    const detalhes = Array.isArray(card.detalhes)
        ? card.detalhes
        : card.observacoes_gerenciais
            ? String(card.observacoes_gerenciais).split('|').map((item) => item.trim()).filter(Boolean)
            : [];

    return {
        id: card.id,
        columnId: card.etapa_kanban || 'Pendente',
        title: card.titulo || 'Card sem título',
        lines: detalhes,
        footer: card.observacoes_gerenciais || '',
        seller: card.setor_origem || 'Gerencia',
        processTag: card.tipo_card || 'Tarefa Interna',
        prioridade: card.prioridade,
        somenteLeitura: card.somenteLeitura || false,
        indicadores: card.indicadores || null,
        updatedAt: card.atualizado_em || card.updatedAt || null,
        updatedByProfile: card.atualizado_por_perfil || card.updatedByProfile || null,
        ...card,
    };
}

function normalizarKanbanGerencial(dados) {
    const etapas = dados?.etapas || [];
    const cardsGerenciais = dados?.cardsGerenciais || [];
    const resumosSetoriais = dados?.resumosSetoriais || [];

    const columns = etapas.map((etapa) => ({
        id: etapa,
        title: etapa,
        tone: etapa === 'Aprovado' ? 'success' : etapa === 'Em Andamento' ? 'accent' : 'neutral',
    }));

    const cards = [
        ...resumosSetoriais,
        ...cardsGerenciais,
    ]
        .map(normalizarCardGerencial)
        .filter(Boolean);

    return {
        gerente: {
            key: 'gerente',
            label: 'Gerência',
            title: 'Kanban Gerencial',
            description: 'Acompanhamento de prioridades, decisões e aprovações da equipe.',
            columns,
            cards,
        },
    };
}

function normalizarColecaoQuadros(carga) {
    if (!carga) return {};

    if (carga.sucesso && carga.dados) {
        return normalizarKanbanGerencial(carga.dados);
    }

    if (carga.dados?.etapas || carga.dados?.cardsGerenciais || carga.dados?.resumosSetoriais) {
        return normalizarKanbanGerencial(carga.dados);
    }

    if (carga.etapas || carga.cardsGerenciais || carga.resumosSetoriais) {
        return normalizarKanbanGerencial(carga);
    }

    const chaveBoards = API_FIELDS.commonEnvelope.boards;

    if (carga[chaveBoards] && typeof carga[chaveBoards] === 'object' && !Array.isArray(carga[chaveBoards])) {
        return carga[chaveBoards];
    }

    if (Array.isArray(carga[chaveBoards])) {
        return Object.fromEntries(carga[chaveBoards].map((quadro) => [quadro[API_FIELDS.board.key], quadro]));
    }

    if (Array.isArray(carga)) {
        return Object.fromEntries(carga.map((quadro) => [quadro[API_FIELDS.board.key], quadro]));
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
                etapa_kanban: idColuna,
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
