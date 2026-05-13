import { QUADRO_PADRAO_POR_PAPEL } from '../config/roles';

const CHAVE_NOTIFICACOES = 'kanbanNotifications';
const DIAS_INATIVIDADE_PADRAO = 20;
const MILISSEGUNDOS_POR_DIA = 1000 * 60 * 60 * 24;

function lerNotificacoes() {
    try {
        const bruto = localStorage.getItem(CHAVE_NOTIFICACOES);
        if (!bruto) return [];
        const notificacoes = JSON.parse(bruto);
        return Array.isArray(notificacoes) ? notificacoes : [];
    } catch {
        return [];
    }
}

function salvarNotificacoes(notificacoes) {
    localStorage.setItem(CHAVE_NOTIFICACOES, JSON.stringify(notificacoes));
}

function obterNomeColunaPorId(mapaColunas, idColuna) {
    return mapaColunas[idColuna] || idColuna;
}

function obterDataIsoValida(dataIso) {
    const data = new Date(dataIso);
    if (Number.isNaN(data.getTime())) {
        return new Date().toISOString();
    }

    return data.toISOString();
}

function gerarIdNotificacao() {
    return `${Date.now()}-${Math.round(Math.random() * 1000000)}`;
}

function ehNotificacaoParaPapel(notificacao, papel) {
    const papeis = notificacao.targetRoles || [];
    if (!papel) return false;
    return papeis.includes(papel);
}

function montarNotificacao({
    type,
    boardKey,
    boardTitle,
    cardId,
    cardTitle,
    message,
    actorProfile,
    targetRoles,
    referenceUpdatedAt,
}) {
    return {
        id: gerarIdNotificacao(),
        type,
        boardKey,
        boardTitle,
        cardId,
        cardTitle,
        message,
        actorProfile,
        targetRoles,
        referenceUpdatedAt: referenceUpdatedAt || null,
        readBy: [],
        createdAt: new Date().toISOString(),
    };
}

export function obterPapeisComAcessoAoQuadro(chaveQuadro) {
    const papeis = Object.entries(QUADRO_PADRAO_POR_PAPEL)
        .filter(([papel, quadroPadrao]) => papel === 'administrador' || quadroPadrao === chaveQuadro)
        .map(([papel]) => papel);

    return [...new Set(papeis)];
}

export function listarNotificacoesKanban(papelUsuario = '') {
    const notificacoes = lerNotificacoes().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (!papelUsuario) return notificacoes;
    return notificacoes.filter((notificacao) => ehNotificacaoParaPapel(notificacao, papelUsuario));
}

export function registrarNotificacaoMudancaEstado({
    chaveQuadro,
    tituloQuadro,
    card,
    colunaOrigem,
    colunaDestino,
    mapaColunas = {},
    perfilAtor,
    papeisDestino = [],
}) {
    const nomeOrigem = obterNomeColunaPorId(mapaColunas, colunaOrigem);
    const nomeDestino = obterNomeColunaPorId(mapaColunas, colunaDestino);

    const notificacao = montarNotificacao({
        type: 'mudanca-status',
        boardKey: chaveQuadro,
        boardTitle: tituloQuadro,
        cardId: card.id,
        cardTitle: card.title,
        actorProfile: perfilAtor,
        targetRoles: papeisDestino,
        referenceUpdatedAt: obterDataIsoValida(card.updatedAt),
        message: `${card.title} mudou de ${nomeOrigem} para ${nomeDestino}.`,
    });

    const notificacoes = lerNotificacoes();
    salvarNotificacoes([notificacao, ...notificacoes]);
    return notificacao;
}

export function verificarNotificacoesInatividade({
    chaveQuadro,
    tituloQuadro,
    cards = [],
    papeisDestino = [],
    diasLimite = DIAS_INATIVIDADE_PADRAO,
}) {
    const notificacoes = lerNotificacoes();
    const agora = new Date();
    const novasNotificacoes = [];

    cards.forEach((card) => {
        const atualizadoEm = new Date(card.updatedAt || card.createdAt || 0);
        if (Number.isNaN(atualizadoEm.getTime())) return;

        const diasSemMovimento = Math.floor((agora.getTime() - atualizadoEm.getTime()) / MILISSEGUNDOS_POR_DIA);
        if (diasSemMovimento <= diasLimite) return;

        const updatedAtPadrao = obterDataIsoValida(card.updatedAt || card.createdAt);
        const jaExiste = notificacoes.some(
            (notificacao) =>
                notificacao.type === 'inatividade'
                && notificacao.boardKey === chaveQuadro
                && notificacao.cardId === card.id
                && notificacao.referenceUpdatedAt === updatedAtPadrao
        );

        if (jaExiste) return;

        novasNotificacoes.push(
            montarNotificacao({
                type: 'inatividade',
                boardKey: chaveQuadro,
                boardTitle: tituloQuadro,
                cardId: card.id,
                cardTitle: card.title,
                actorProfile: 'sistema',
                targetRoles: papeisDestino,
                referenceUpdatedAt: updatedAtPadrao,
                message: `${card.title} esta sem movimentacao ha ${diasSemMovimento} dias.`,
            })
        );
    });

    if (novasNotificacoes.length) {
        salvarNotificacoes([...novasNotificacoes, ...notificacoes]);
    }

    return novasNotificacoes;
}

export function marcarNotificacaoComoLida(idNotificacao, papelUsuario) {
    if (!idNotificacao || !papelUsuario) return;

    const notificacoes = lerNotificacoes();
    const atualizadas = notificacoes.map((notificacao) => {
        if (notificacao.id !== idNotificacao) return notificacao;
        if ((notificacao.readBy || []).includes(papelUsuario)) return notificacao;

        return {
            ...notificacao,
            readBy: [...(notificacao.readBy || []), papelUsuario],
        };
    });

    salvarNotificacoes(atualizadas);
}

export function marcarTodasNotificacoesComoLidas(papelUsuario) {
    if (!papelUsuario) return;

    const notificacoes = lerNotificacoes();
    const atualizadas = notificacoes.map((notificacao) => {
        if (!ehNotificacaoParaPapel(notificacao, papelUsuario)) return notificacao;
        if ((notificacao.readBy || []).includes(papelUsuario)) return notificacao;

        return {
            ...notificacao,
            readBy: [...(notificacao.readBy || []), papelUsuario],
        };
    });

    salvarNotificacoes(atualizadas);
}