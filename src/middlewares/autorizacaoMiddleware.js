const jwt = require('jsonwebtoken');
const verificarAcesso = (cargos = [], modulo = null) => {
    return (req, res, next) => {
        const auth = req.headers.authorization;
        if (!auth) return res.status(401).json({ erro: 'Sem token' });
        try {
            const dec = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
            if (dec.cargo === 'Gerente') return next();
            const cargoOk = cargos.length === 0 || cargos.includes(dec.cargo);
            const moduloOk = modulo ? dec.permissoes[modulo] === 1 : true;
            if (!cargoOk || !moduloOk) return res.status(403).json({ erro: 'Acesso negado' });
            req.usuario = dec; next();
        } catch (e) { res.status(401).json({ erro: 'Token inválido' }); }
    };
};
module.exports = verificarAcesso;