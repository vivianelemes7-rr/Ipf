const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AutenticacaoService = {
    async criptografarSenha(senha) { return await bcrypt.hash(senha, 10); },
    async compararSenha(s1, s2) { return await bcrypt.compare(s1, s2); },
    gerarToken(u) {
        return jwt.sign({ 
            id: u.id, cargo: u.cargo, 
            permissoes: { 
                modulo_vendas: u.modulo_vendas, modulo_financeiro: u.modulo_financeiro,
                modulo_producao: u.modulo_producao, modulo_arquitetura: u.modulo_arquitetura 
            } 
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
};
module.exports = AutenticacaoService;