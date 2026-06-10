const conexao = require('../config/database');
const { construirUpdateSeguro } = require('../utils/updateSeguro');

const CAMPOS_ATUALIZAVEIS = [
    'modulo_vendas',
    'modulo_financeiro',
    'modulo_producao',
    'modulo_arquitetura',
    'pode_editar',
    'pode_deletar',
    'ver_apenas_proprio',
    'pode_retroceder_card',
    'pode_mover_qualquer_etapa',
    'pode_reabrir_card',
    'pode_aprovar_entrega_etapa',
    'pode_forcar_transicao',
    'pode_trocar_responsavel',
    'pode_assumir_card',
    'pode_alterar_prazos',
    'pode_alterar_prioridade',
    'pode_ver_valores',
    'pode_arquivar_card',
    'pode_deletar_comentarios',
    'pode_editar_comentarios_outros',
    'pode_marcar_impedimento',
    'pode_destravar_impedimento'
];

function valorPermissao(dados, campo, padrao = 0) {
    return dados[campo] ?? padrao;
}

function normalizarPermissoes(dados = {}) {
    return {
        modulo_vendas: valorPermissao(dados, 'modulo_vendas'),
        modulo_financeiro: valorPermissao(dados, 'modulo_financeiro'),
        modulo_producao: valorPermissao(dados, 'modulo_producao'),
        modulo_arquitetura: valorPermissao(dados, 'modulo_arquitetura'),

        pode_editar: valorPermissao(dados, 'pode_editar'),
        pode_deletar: valorPermissao(dados, 'pode_deletar'),
        ver_apenas_proprio: valorPermissao(dados, 'ver_apenas_proprio', 1),
        pode_retroceder_card: valorPermissao(dados, 'pode_retroceder_card'),
        pode_mover_qualquer_etapa: valorPermissao(dados, 'pode_mover_qualquer_etapa'),
        pode_reabrir_card: valorPermissao(dados, 'pode_reabrir_card'),
        pode_aprovar_entrega_etapa: valorPermissao(dados, 'pode_aprovar_entrega_etapa'),
        pode_forcar_transicao: valorPermissao(dados, 'pode_forcar_transicao'),
        pode_trocar_responsavel: valorPermissao(dados, 'pode_trocar_responsavel'),
        pode_assumir_card: valorPermissao(dados, 'pode_assumir_card', 1),
        pode_alterar_prazos: valorPermissao(dados, 'pode_alterar_prazos', 1),
        pode_alterar_prioridade: valorPermissao(dados, 'pode_alterar_prioridade'),
        pode_ver_valores: valorPermissao(dados, 'pode_ver_valores', 1),
        pode_arquivar_card: valorPermissao(dados, 'pode_arquivar_card'),
        pode_deletar_comentarios: valorPermissao(dados, 'pode_deletar_comentarios'),
        pode_editar_comentarios_outros: valorPermissao(dados, 'pode_editar_comentarios_outros'),
        pode_marcar_impedimento: valorPermissao(dados, 'pode_marcar_impedimento', 1),
        pode_destravar_impedimento: valorPermissao(dados, 'pode_destravar_impedimento')
    };
}

const PermissoesModel = {
    async obterPorFuncionario(funcionario_id) {
        const query = `
            SELECT
                id,
                funcionario_id,
                modulo_vendas,
                modulo_financeiro,
                modulo_producao,
                modulo_arquitetura,
                pode_editar,
                pode_deletar,
                ver_apenas_proprio,
                pode_retroceder_card,
                pode_mover_qualquer_etapa,
                pode_reabrir_card,
                pode_aprovar_entrega_etapa,
                pode_forcar_transicao,
                pode_trocar_responsavel,
                pode_assumir_card,
                pode_alterar_prazos,
                pode_alterar_prioridade,
                pode_ver_valores,
                pode_arquivar_card,
                pode_deletar_comentarios,
                pode_editar_comentarios_outros,
                pode_marcar_impedimento,
                pode_destravar_impedimento,
                ultima_atualizacao
            FROM permissoes
            WHERE funcionario_id = ?
        `;
        const [linhas] = await conexao.query(query, [funcionario_id]);
        return linhas[0];
    },

    async criar(funcionario_id, dados = {}) {
        const permissoes = normalizarPermissoes(dados);
        const campos = ['funcionario_id', ...CAMPOS_ATUALIZAVEIS];
        const valores = [
            funcionario_id,
            ...CAMPOS_ATUALIZAVEIS.map((campo) => permissoes[campo])
        ];

        const placeholders = campos.map(() => '?').join(', ');

        const query = `
            INSERT INTO permissoes (${campos.join(', ')})
            VALUES (${placeholders})
        `;

        const [res] = await conexao.query(query, valores);
        return res.insertId;
    },

    async atualizar(funcionario_id, dados) {
        const { query, valores } = construirUpdateSeguro(
            'permissoes',
            dados,
            CAMPOS_ATUALIZAVEIS,
            'funcionario_id'
        );
        const [res] = await conexao.query(query, [...valores, funcionario_id]);
        return res.affectedRows;
    },

    async salvarOuAtualizar(funcionario_id, dados) {
        const [rows] = await conexao.query(
            'SELECT id FROM permissoes WHERE funcionario_id = ?',
            [funcionario_id]
        );

        if (rows.length > 0) {
            return await this.atualizar(funcionario_id, dados);
        }

        return await this.criar(funcionario_id, dados);
    },

    async deletar(funcionario_id) {
        const [res] = await conexao.query(
            'DELETE FROM permissoes WHERE funcionario_id = ?',
            [funcionario_id]
        );
        return res.affectedRows;
    }
};

module.exports = PermissoesModel;
