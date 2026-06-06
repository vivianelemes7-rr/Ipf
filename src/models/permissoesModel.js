const conexao = require('../config/database');
const { construirUpdateSeguro } = require('../utils/updateSeguro');

const CAMPOS_ATUALIZAVEIS = [
    'modulo_vendas', 'modulo_financeiro', 'modulo_producao', 'modulo_arquitetura',
    'pode_editar', 'pode_deletar', 'ver_apenas_proprio',
    'pode_retroceder_card', 'pode_mover_qualquer_etapa', 'pode_reabrir_card',
    'pode_aprovar_entrega_etapa', 'pode_forcar_transicao',
    'pode_trocar_responsavel', 'pode_assumir_card',
    'pode_alterar_prazos', 'pode_alterar_prioridade',
    'pode_ver_valores', 'pode_arquivar_card',
    'pode_deletar_comentarios', 'pode_editar_comentarios_outros',
    'pode_marcar_impedimento', 'pode_destravar_impedimento'
];

const PermissoesModel = {
    async obterPorFuncionario(funcionario_id) {
        const query = `
            SELECT 
                id, funcionario_id,
                modulo_vendas, modulo_financeiro, modulo_producao, modulo_arquitetura,
                pode_editar, pode_deletar, ver_apenas_proprio,
                pode_retroceder_card, pode_mover_qualquer_etapa, pode_reabrir_card,
                pode_aprovar_entrega_etapa, pode_forcar_transicao,
                pode_trocar_responsavel, pode_assumir_card,
                pode_alterar_prazos, pode_alterar_prioridade,
                pode_ver_valores, pode_arquivar_card,
                pode_deletar_comentarios, pode_editar_comentarios_outros,
                pode_marcar_impedimento, pode_destravar_impedimento,
                ultima_atualizacao
            FROM permissoes
            WHERE funcionario_id = ?`;
        const [linhas] = await conexao.query(query, [funcionario_id]);
        return linhas[0];
    },

    async criar(funcionario_id, dados) {
        const query = `
            INSERT INTO permissoes (
                funcionario_id, modulo_vendas, modulo_financeiro, modulo_producao, modulo_arquitetura,
                pode_editar, pode_deletar, ver_apenas_proprio,
                pode_retroceder_card, pode_mover_qualquer_etapa, pode_reabrir_card,
                pode_aprovar_entrega_etapa, pode_forcar_transicao,
                pode_trocar_responsavel, pode_assumir_card,
                pode_alterar_prazos, pode_alterar_prioridade,
                pode_ver_valores, pode_arquivar_card,
                pode_deletar_comentarios, pode_editar_comentarios_outros,
                pode_marcar_impedimento, pode_destravar_impedimento
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        const [res] = await conexao.query(query, [
            funcionario_id,
            dados.modulo_vendas || 0,
            dados.modulo_financeiro || 0,
            dados.modulo_producao || 0,
            dados.modulo_arquitetura || 0,
            dados.pode_editar || 0,
            dados.pode_deletar || 0,
            dados.ver_apenas_proprio ?? 1,
            dados.pode_retroceder_card || 0,
            dados.pode_mover_qualquer_etapa || 0,
            dados.pode_reabrir_card || 0,
            dados.pode_aprovar_entrega_etapa || 0,
            dados.pode_forcar_transicao || 0,
            dados.pode_trocar_responsavel || 0,
            dados.pode_assumir_card ?? 1,
            dados.pode_alterar_prazos ?? 1,
            dados.pode_alterar_prioridade || 0,
            dados.pode_ver_valores ?? 1,
            dados.pode_arquivar_card || 0,
            dados.pode_deletar_comentarios || 0,
            dados.pode_editar_comentarios_outros || 0,
            dados.pode_marcar_impedimento ?? 1,
            dados.pode_destravar_impedimento || 0
        ]);
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
        const [rows] = await conexao.query('SELECT id FROM permissoes WHERE funcionario_id = ?', [funcionario_id]);
        if (rows.length > 0) {
            return await this.atualizar(funcionario_id, dados);
        }
        return await this.criar(funcionario_id, dados);
    },

    async deletar(funcionario_id) {
        const [res] = await conexao.query('DELETE FROM permissoes WHERE funcionario_id = ?', [funcionario_id]);
        return res.affectedRows;
    }
};

module.exports = PermissoesModel;
