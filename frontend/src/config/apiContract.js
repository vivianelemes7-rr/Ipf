export const API_ENDPOINTS = {
    auth: {
        login: '/auth/login',
    },
    kanban: {
        boards: '/gerencia/kanban',
        boardCard: (boardKey, cardId) => `/gerencia/kanban/cards/${cardId}`,
        boardCards: (boardKey) => '/gerencia/kanban/cards',
    },
    gerencia: {
        kanban: '/gerencia/kanban',
        criarCard: '/gerencia/kanban/cards',
        buscarCard: (id) => `/gerencia/kanban/cards/${id}`,
        atualizarCard: (id) => `/gerencia/kanban/cards/${id}`,
        moverCard: (id) => `/gerencia/kanban/cards/${id}/etapa`,
        excluirCard: (id) => `/gerencia/kanban/cards/${id}`,
    },
    clientes: {
        listar: '/clientes',
        buscarPorId: (id) => `/clientes/${id}`,
        criar: '/clientes',
        atualizar: (id) => `/clientes/${id}`,
        converter: (id) => `/clientes/${id}/converter`,
        arquivar: (id) => `/clientes/${id}/arquivar`,
    },
    pedidos: {
        listar: '/pedidos',
        buscarPorId: (id) => `/pedidos/${id}`,
        criar: '/pedidos',
        atualizar: (id) => `/pedidos/${id}`,
        avancar: (id) => `/pedidos/${id}/avancar`,
        cancelar: (id) => `/pedidos/${id}/cancelar`,
        finalizar: (id) => `/pedidos/${id}/finalizar`,
    },
    crm: {
        listar: '/crm',
        criar: '/crm',
        atualizar: (id) => `/crm/${id}`,
        moverEtapa: (id) => `/crm/${id}/etapa`,
        anexarProposta: (id) => `/crm/${id}/proposta`,
        marcarPropostaEnviada: (id) => `/crm/${id}/proposta-enviada`,
        marcarGanho: (id) => `/crm/${id}/ganho`,
        marcarPerdido: (id) => `/crm/${id}/perdido`,
        deletar: (id) => `/crm/${id}`,
    },
};

export const API_FIELDS = {
    authRequest: {
        email: 'email',
        password: 'password',
        role: 'role',
    },
    authResponse: {
        token: 'token',
        accessToken: 'accessToken',
        user: 'user',
        userId: 'userId',
        name: 'name',
        email: 'email',
        role: 'role',
    },
    commonEnvelope: {
        data: 'data',
        boards: 'boards',
        message: 'message',
    },
    board: {
        key: 'key',
        title: 'title',
        columns: 'columns',
        cards: 'cards',
    },
    column: {
        id: 'id',
        title: 'title',
        tone: 'tone',
    },
    card: {
        id: 'id',
        columnId: 'columnId',
        title: 'title',
        lines: 'lines',
        footer: 'footer',
        seller: 'seller',
        processTag: 'processTag',
        budgetFileName: 'budgetFileName',
        clientDocument: 'clientDocument',
        clientAddress: 'clientAddress',
        homologadoCliente: 'homologadoCliente',
        updatedAt: 'updatedAt',
        updatedByProfile: 'updatedByProfile',
    },
};

export const API_VALUES = {
    roles: ['administrador', 'arquitetura', 'producao', 'vendedor', 'gerente', 'financeiro', 'logistica'],
    processTags: ['normal', 'especial'],
    boardKeys: ['arquitetura', 'producao', 'vendedor', 'gerente', 'financeiro', 'logistica'],
};
