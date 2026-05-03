const manipuladorErros = (erro, req, res, next) => {
    // Log detalhado no console para o desenvolvedor
    console.error('--- [ERRO NO SERVIDOR] ---');
    console.error(`Data/Hora: ${new Date().toISOString()}`);
    console.error(`Método: ${req.method} | URL: ${req.originalUrl}`);
    console.error(`Mensagem: ${erro.message}`);
    if (process.env.NODE_ENV !== 'production') console.error(erro.stack);
    console.error('--------------------------');

    let statusCode = erro.statusCode || 500;
    let mensagem = erro.message || 'Erro interno no servidor.';

    // Tratamento de erros específicos do MySQL
    if (erro.code === 'ER_DUP_ENTRY') {
        statusCode = 409;
        mensagem = 'Este registro (e-mail ou ID) já existe no sistema.';
    }

    if (erro.code === 'ECONNREFUSED') {
        statusCode = 503;
        mensagem = 'Falha na conexão com o banco de dados.';
    }

    // Erros de Autenticação JWT
    if (erro.name === 'TokenExpiredError') {
        statusCode = 401;
        mensagem = 'Sua sessão expirou, faça login novamente.';
    }

    res.status(statusCode).json({
        sucesso: false,
        status: statusCode,
        mensagem: mensagem
    });
};

module.exports = manipuladorErros;