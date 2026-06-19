const AppError = require('../utils/AppError');

function normalizarErro(erro) {
    if (erro instanceof AppError) {
        return erro;
    }

    if (erro.statusCode && erro.isOperational !== false) {
        return new AppError(erro.statusCode, erro.message, {
            detalhes: erro.detalhes,
            codigo: erro.codigo
        });
    }

    if (erro.code === 'ER_DUP_ENTRY') {
        const msg = String(erro.message || '');
        if (/email|e-mail|mail/i.test(msg)) {
            return AppError.conflict('E-mail já cadastrado.');
        }
        return AppError.conflict('Este registro (e-mail ou ID) já existe no sistema.');
    }

    if (erro.code === 'ECONNREFUSED' || erro.code === 'PROTOCOL_CONNECTION_LOST') {
        return AppError.serviceUnavailable('Falha na conexão com o banco de dados.');
    }

    if (erro.name === 'TokenExpiredError') {
        return AppError.unauthorized('Sua sessão expirou. Faça login novamente.');
    }

    if (erro.name === 'JsonWebTokenError') {
        return AppError.unauthorized('Token inválido.');
    }

    if (erro instanceof SyntaxError && erro.status === 400 && 'body' in erro) {
        return AppError.badRequest('JSON inválido no corpo da requisição.');
    }

    if (erro.message === 'Nenhum campo válido para atualizar') {
        return AppError.badRequest(erro.message);
    }

    if (erro.message?.startsWith('Tabela não permitida')) {
        return AppError.internal('Erro de configuração na atualização de dados.');
    }

    return AppError.internal(
        process.env.NODE_ENV === 'production'
            ? 'Erro interno no servidor.'
            : erro.message || 'Erro interno no servidor.'
    );
}

const manipuladorErros = (erro, req, res, next) => {
    const erroNormalizado = normalizarErro(erro);

    console.error('--- [ERRO NO SERVIDOR] ---');
    console.error(`Data/Hora: ${new Date().toISOString()}`);
    console.error(`Método: ${req.method} | URL: ${req.originalUrl}`);
    console.error(`Status: ${erroNormalizado.statusCode} | Código: ${erroNormalizado.codigo || 'N/A'}`);
    console.error(`Mensagem: ${erroNormalizado.message}`);
    if (erroNormalizado.detalhes) {
        console.error('Detalhes:', erroNormalizado.detalhes);
    }
    if (process.env.NODE_ENV !== 'production' && erro.stack) {
        console.error(erro.stack);
    }
    console.error('--------------------------');

    const resposta = {
        sucesso: false,
        status: erroNormalizado.statusCode,
        mensagem: erroNormalizado.message
    };

    if (erroNormalizado.codigo) {
        resposta.codigo = erroNormalizado.codigo;
    }

    if (erroNormalizado.detalhes) {
        resposta.erros = erroNormalizado.detalhes;
        resposta.detalhes = erroNormalizado.detalhes;
    }

    res.status(erroNormalizado.statusCode).json(resposta);
};

const rotaNaoEncontrada = (req, res, next) => {
    next(AppError.notFound(`Rota não encontrada: ${req.method} ${req.originalUrl}`));
};

module.exports = { manipuladorErros, rotaNaoEncontrada, normalizarErro };
