export const API_ENDPOINTS = {
    auth: {
        login: '/auth/login',
    },
    kanban: {
        boards: '/kanban/boards',
        boardCard: (boardKey, cardId) => `/kanban/boards/${boardKey}/cards/${cardId}`,
        boardCards: (boardKey) => `/kanban/boards/${boardKey}/cards`,
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
