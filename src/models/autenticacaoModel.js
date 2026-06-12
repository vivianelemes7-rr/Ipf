const conexao = require('../config/database');

const AutenticacaoModel = {
    async buscarPorEmailParaLogin(email) {
        const query = `
            SELECT f.id, f.nome, f.email, f.senha, f.cargo, f.status_ativo,
                   p.modulo_vendas, p.modulo_financeiro, p.modulo_producao,
                   p.modulo_arquitetura, p.pode_editar, p.pode_deletar, p.ver_apenas_proprio,
                   p.pode_retroceder_card, p.pode_mover_qualquer_etapa, p.pode_reabrir_card,
                   p.pode_aprovar_entrega_etapa, p.pode_forcar_transicao,
                   p.pode_trocar_responsavel, p.pode_assumir_card,
                   p.pode_alterar_prazos, p.pode_alterar_prioridade,
                   p.pode_ver_valores, p.pode_arquivar_card,
                   p.pode_deletar_comentarios, p.pode_editar_comentarios_outros,
                   p.pode_marcar_impedimento, p.pode_destravar_impedimento
            FROM funcionarios f
            INNER JOIN permissoes p ON f.id = p.funcionario_id
            WHERE f.email = ?`;
        const [linhas] = await conexao.query(query, [email]);
        return linhas[0];
    },

    async buscarPorId(id) {
        const query = `
            SELECT f.id, f.nome, f.email, f.senha, f.cargo, f.status_ativo,
                   p.modulo_vendas, p.modulo_financeiro, p.modulo_producao,
                   p.modulo_arquitetura, p.pode_editar, p.pode_deletar, p.ver_apenas_proprio,
                   p.pode_retroceder_card, p.pode_mover_qualquer_etapa, p.pode_reabrir_card,
                   p.pode_aprovar_entrega_etapa, p.pode_forcar_transicao,
                   p.pode_trocar_responsavel, p.pode_assumir_card,
                   p.pode_alterar_prazos, p.pode_alterar_prioridade,
                   p.pode_ver_valores, p.pode_arquivar_card,
                   p.pode_deletar_comentarios, p.pode_editar_comentarios_outros,
                   p.pode_marcar_impedimento, p.pode_destravar_impedimento
            FROM funcionarios f
            INNER JOIN permissoes p ON f.id = p.funcionario_id
            WHERE f.id = ?`;
        const [linhas] = await conexao.query(query, [id]);
        return linhas[0];
    },

    async atualizarSenha(id, novaSenhaHash) {
        const query = 'UPDATE funcionarios SET senha = ? WHERE id = ?';
        const [result] = await conexao.query(query, [novaSenhaHash, id]);
        return result;
    }
};

module.exports = AutenticacaoModel;