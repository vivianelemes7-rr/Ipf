const conexao = require('../config/ipfdb');

const AutenticacaoModel = {
    async buscarPorEmailParaLogin(email) {
        const query = `
            SELECT f.id, f.nome, f.email, f.senha, f.cargo, f.status_ativo,
                   p.modulo_vendas, p.modulo_financeiro, p.modulo_producao, 
                   p.modulo_arquitetura, p.pode_editar, p.pode_deletar, p.ver_apenas_proprio
            FROM funcionarios f
            LEFT JOIN permissoes p ON f.id = p.funcionario_id
            WHERE f.email = ?`;
        const [linhas] = await conexao.query(query, [email]);
        return linhas[0];
    }
};

module.exports = AutenticacaoModel;