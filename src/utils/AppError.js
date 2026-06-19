class AppError extends Error {
    constructor(statusCode, mensagem, opcoes = {}) {
        super(mensagem);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.detalhes = opcoes.detalhes;
        this.codigo = opcoes.codigo;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(mensagem, detalhes) {
        return new AppError(400, mensagem, { detalhes, codigo: 'BAD_REQUEST' });
    }

    static unauthorized(mensagem = 'Não autenticado') {
        return new AppError(401, mensagem, { codigo: 'UNAUTHORIZED' });
    }

    static forbidden(mensagem = 'Acesso negado') {
        return new AppError(403, mensagem, { codigo: 'FORBIDDEN' });
    }

    static notFound(mensagem = 'Recurso não encontrado') {
        return new AppError(404, mensagem, { codigo: 'NOT_FOUND' });
    }

    static conflict(mensagem) {
        return new AppError(409, mensagem, { codigo: 'CONFLICT' });
    }

    static unprocessable(mensagem, detalhes) {
        return new AppError(422, mensagem, { detalhes, codigo: 'VALIDATION_ERROR' });
    }

    static tooManyRequests(mensagem = 'Muitas requisições. Tente novamente em 1 minuto') {
        return new AppError(429, mensagem, { codigo: 'RATE_LIMIT' });
    }

    static internal(mensagem = 'Erro interno no servidor') {
        return new AppError(500, mensagem, { codigo: 'INTERNAL_ERROR' });
    }

    static serviceUnavailable(mensagem = 'Serviço temporariamente indisponível') {
        return new AppError(503, mensagem, { codigo: 'SERVICE_UNAVAILABLE' });
    }
}

module.exports = AppError;
