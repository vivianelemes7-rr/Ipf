const AppError = require('../utils/AppError');

const rateLimit = (() => {
    const tentativas = new Map();

    return (limite = 5, tempoJanela = 60000) => {
        return (req, res, next) => {
            const chave = req.ip || req.socket?.remoteAddress || 'unknown';
            const agora = Date.now();

            if (!tentativas.has(chave)) {
                tentativas.set(chave, []);
            }

            const timestamps = tentativas.get(chave);
            const timestampsValidos = timestamps.filter(t => agora - t < tempoJanela);

            if (timestampsValidos.length >= limite) {
                return next(AppError.tooManyRequests());
            }

            timestampsValidos.push(agora);
            tentativas.set(chave, timestampsValidos);
            next();
        };
    };
})();

module.exports = { rateLimit };
