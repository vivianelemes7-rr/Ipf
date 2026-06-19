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

    // O quadro de vendedor usa um fluxo de 2 passos:
    // 1. Cria o lead em /leads/cadastrar
    // 2. Cria o card CRM em /crm com o lead_id obtido
    if (chaveQuadro === 'vendedor') {
        return await criarCardVendedor(card);
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

async function criarCardVendedor(card) {
    // Se o Kanban.jsx já criou o lead e passou o lead_id no card,
    // pula o passo 1 para evitar criação duplicada de lead.
    let leadId = card.lead_id ?? null;

    if (!leadId) {
        // Passo 1: criar o lead (fallback caso lead_id não venha no card)
        try {
            const payloadLead = {
                nome_contato: card.title || '',
                cpf_cnpj: card.clientDocument || '',
                endereco_completo: card.clientAddress || '',
                notas: Array.isArray(card.lines) ? card.lines.join('\n') : '',
                origem: 'Kanban',
                status_lead: 'Novo',
                telefone: '',
                email: '',
            };
            const respostaLead = await requisicao('/leads/cadastrar', {
                metodo: 'POST',
                corpo: payloadLead,
            });
            leadId = respostaLead?.id ?? respostaLead?.insertId ?? respostaLead?.lead_id ?? null;
            if (!leadId) throw new Error('Lead criado mas ID não retornado pelo servidor.');
        } catch (erro) {
            console.warn('Falha ao criar lead para card de vendedor:', erro);
            return { success: false, message: `Erro ao criar lead: ${erro.message}` };
        }
    }

    // Passo 2: criar o card CRM com o lead_id
    // Capitaliza a etapa para bater com os valores aceitos pelo backend
    // ex: 'lead' → 'Lead', 'contato' → 'Contato'
    const etapaRaw = card.columnId || 'Lead';
    const etapaKanban = etapaRaw.charAt(0).toUpperCase() + etapaRaw.slice(1);

    try {
        const payloadCrm = {
            lead_id: leadId,
            etapa_kanban: etapaKanban,
            observacoes_venda: Array.isArray(card.lines) ? card.lines.join(' | ') : (card.footer || ''),
            prioridade: 2,
        };
        const respostaCrm = await requisicao('/crm', {
            metodo: 'POST',
            corpo: payloadCrm,
        });
        return respostaCrm;
    } catch (erro) {
        console.warn('Falha ao criar card CRM:', erro);
        return { success: false, message: `Lead criado (id: ${leadId}), mas falha ao criar card CRM: ${erro.message}` };
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
