const conexao = require('../config/ipfdb');

const FuncionarioModel = {
    async listarTodos() {
        const query = `
            SELECT f.id, f.nome, f.email, f.cargo, f.status_ativo, f.departamento,
                   p.modulo_vendas, p.modulo_financeiro, p.modulo_producao, p.modulo_arquitetura
            FROM funcionarios f
            LEFT JOIN permissoes p ON f.id = p.funcionario_id`;
        const [linhas] = await conexao.query(query);
        return linhas;
    },

    async criar(dadosFunc, dadosPerm) {
        const conn = await conexao.getConnection();
        try {
            await conn.beginTransaction();
            const [res] = await conn.query(
                `INSERT INTO funcionarios (nome, email, senha, cargo, departamento, status_ativo) VALUES (?, ?, ?, ?, ?, ?)`,
                [dadosFunc.nome, dadosFunc.email, dadosFunc.senha, dadosFunc.cargo, dadosFunc.departamento, dadosFunc.status_ativo]
            );
            await conn.query(
                `INSERT INTO permissoes (funcionario_id, modulo_vendas, modulo_financeiro, modulo_producao, modulo_arquitetura, pode_editar, pode_deletar, ver_apenas_proprio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [res.insertId, dadosPerm.modulo_vendas || 0, dadosPerm.modulo_financeiro || 0, dadosPerm.modulo_producao || 0, dadosPerm.modulo_arquitetura || 0, dadosPerm.pode_editar || 0, dadosPerm.pode_deletar || 0, dadosPerm.ver_apenas_proprio ?? 1]
            );
            await conn.commit();
            return res.insertId;
        } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    },

    async atualizarFuncionario(id, dados) {
        const campos = Object.keys(dados).map(c => `${c} = ?`).join(', ');
        const [res] = await conexao.query(`UPDATE funcionarios SET ${campos} WHERE id = ?`, [...Object.values(dados), id]);
        return res.affectedRows;
    },

    async atualizarPermissoes(f_id, dados) {
        const campos = Object.keys(dados).map(c => `${c} = ?`).join(', ');
        const [res] = await conexao.query(`UPDATE permissoes SET ${campos} WHERE funcionario_id = ?`, [...Object.values(dados), f_id]);
        return res.affectedRows;
    },

    async deletar(id) {
        const [res] = await conexao.query('DELETE FROM funcionarios WHERE id = ?', [id]);
        return res.affectedRows;
    }
};

module.exports = FuncionarioModel;