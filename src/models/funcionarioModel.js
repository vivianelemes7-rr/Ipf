const conexao = require('../config/database');
const { construirUpdateSeguro } = require('../utils/updateSeguro');

const CAMPOS_ATUALIZAVEIS = ['nome', 'email', 'cargo', 'departamento', 'status_ativo', 'senha'];

const FuncionarioModel = {
    async listarTodos() {
        const query = `
            SELECT f.id, f.nome, f.email, f.cargo, f.status_ativo, f.departamento, f.data_cadastro
            FROM funcionarios f
            ORDER BY f.id`;
        const [linhas] = await conexao.query(query);
        return linhas;
    },

    async listarPorCargo(cargo) {
        const query = `
            SELECT f.id, f.nome, f.email, f.cargo, f.status_ativo, f.departamento, f.data_cadastro
            FROM funcionarios f
            WHERE LOWER(f.cargo) = LOWER(?)
            ORDER BY f.nome`;
        const [linhas] = await conexao.query(query, [cargo]);
        return linhas;
    },

    async buscarPorId(id) {
        const query = `
            SELECT f.id, f.nome, f.email, f.cargo, f.status_ativo, f.departamento, f.data_cadastro
            FROM funcionarios f
            WHERE f.id = ?`;
        const [linhas] = await conexao.query(query, [id]);
        return linhas[0];
    },

    async buscarPorEmail(email) {
        const query = `
            SELECT f.id, f.nome, f.email, f.cargo, f.status_ativo, f.departamento, f.data_cadastro
            FROM funcionarios f
            WHERE f.email = ?`;
        const [linhas] = await conexao.query(query, [email]);
        return linhas[0];
    },

    async existeAdministradorAtivo() {
        const query = `
            SELECT COUNT(*) AS total
            FROM funcionarios
            WHERE LOWER(cargo) = 'administrador'
              AND status_ativo = 1`;
        const [linhas] = await conexao.query(query);
        return Number(linhas[0]?.total || 0) > 0;
    },

    async criar(dadosFunc) {
        const [res] = await conexao.query(
            `INSERT INTO funcionarios (nome, email, senha, cargo, departamento, status_ativo) VALUES (?, ?, ?, ?, ?, ?)`,
            [dadosFunc.nome, dadosFunc.email, dadosFunc.senha, dadosFunc.cargo, dadosFunc.departamento, dadosFunc.status_ativo]
        );
        return res.insertId;
    },

    async atualizarFuncionario(id, dados) {
        const { query, valores } = construirUpdateSeguro(
            'funcionarios',
            dados,
            CAMPOS_ATUALIZAVEIS,
            'id'
        );
        const [res] = await conexao.query(query, [...valores, id]);
        return res.affectedRows;
    },

    async deletar(id) {
        const [res] = await conexao.query('DELETE FROM funcionarios WHERE id = ?', [id]);
        return res.affectedRows;
    }
};

module.exports = FuncionarioModel;
