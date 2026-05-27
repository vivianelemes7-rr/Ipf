const db = require('../config/database');

const CAMPOS_ATUALIZAVEIS = [
    'etapa_kanban',
    'titulo',
    'detalhes_json',
    'observacoes_gerenciais',
    'setor_origem',
    'tipo_card',
    'prioridade',
    'responsavel_gerencia_id',
    'atualizado_por_id',
    'atualizado_por_perfil'
];

function selectCardGerencia() {
    return `
        SELECT
            kg.id,
            kg.etapa_kanban,
            kg.titulo,
            kg.detalhes_json,
            kg.observacoes_gerenciais,
            kg.setor_origem,
            kg.tipo_card,
            kg.prioridade,
            kg.responsavel_gerencia_id,
            responsavel.nome AS responsavel_nome,
            kg.criado_por_id,
            criado_por.nome AS criado_por_nome,
            kg.atualizado_por_id,
            atualizado_por.nome AS atualizado_por_nome,
            kg.criado_por_perfil,
            kg.atualizado_por_perfil,
            kg.data_criacao,
            kg.ultima_atualizacao
        FROM kanban_gerencia kg
        LEFT JOIN funcionarios responsavel ON responsavel.id = kg.responsavel_gerencia_id
        LEFT JOIN funcionarios criado_por ON criado_por.id = kg.criado_por_id
        LEFT JOIN funcionarios atualizado_por ON atualizado_por.id = kg.atualizado_por_id
    `;
}

function montarFiltros(filtros = {}) {
    const where = [];
    const params = [];

    if (filtros.etapa_kanban) {
        where.push('kg.etapa_kanban = ?');
        params.push(filtros.etapa_kanban);
    }

    if (filtros.setor_origem) {
        where.push('kg.setor_origem = ?');
        params.push(filtros.setor_origem);
    }

    if (filtros.tipo_card) {
        where.push('kg.tipo_card = ?');
        params.push(filtros.tipo_card);
    }

    if (filtros.prioridade) {
        where.push('kg.prioridade = ?');
        params.push(filtros.prioridade);
    }

    if (filtros.responsavel_gerencia_id) {
        where.push('kg.responsavel_gerencia_id = ?');
        params.push(filtros.responsavel_gerencia_id);
    }

    return {
        where: where.length ? `WHERE ${where.join(' AND ')}` : '',
        params
    };
}

class KanbanGerenciaModel {
    static async listarCards(filtros = {}) {
        const { where, params } = montarFiltros(filtros);
        const [rows] = await db.query(
            `${selectCardGerencia()} ${where}
             ORDER BY FIELD(kg.prioridade, 'Urgente', 'Alta', 'Media', 'Baixa'), kg.ultima_atualizacao DESC, kg.id DESC`,
            params
        );
        return rows;
    }

    static async buscarPorId(id) {
        const [rows] = await db.query(`${selectCardGerencia()} WHERE kg.id = ?`, [id]);
        return rows[0] || null;
    }

    static async criarCard(dados) {
        const [result] = await db.query(
            `INSERT INTO kanban_gerencia (
                etapa_kanban,
                titulo,
                detalhes_json,
                observacoes_gerenciais,
                setor_origem,
                tipo_card,
                prioridade,
                responsavel_gerencia_id,
                criado_por_id,
                atualizado_por_id,
                criado_por_perfil,
                atualizado_por_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.etapa_kanban || 'Pendente',
                dados.titulo,
                dados.detalhes_json || null,
                dados.observacoes_gerenciais || null,
                dados.setor_origem || 'Gerencia',
                dados.tipo_card || 'Tarefa Interna',
                dados.prioridade || 'Media',
                dados.responsavel_gerencia_id || null,
                dados.criado_por_id || null,
                dados.atualizado_por_id || null,
                dados.criado_por_perfil || null,
                dados.atualizado_por_perfil || null
            ]
        );
        return result;
    }

    static async atualizarCard(id, dados) {
        const campos = CAMPOS_ATUALIZAVEIS.filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo));
        if (campos.length === 0) return 0;

        const sets = campos.map((campo) => `${campo} = ?`).join(', ');
        const params = campos.map((campo) => dados[campo]);
        params.push(id);

        const [result] = await db.query(
            `UPDATE kanban_gerencia
             SET ${sets}, ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            params
        );
        return result.affectedRows;
    }

    static async atualizarEtapa(id, etapa, dadosAuditoria = {}) {
        const [result] = await db.query(
            `UPDATE kanban_gerencia
             SET etapa_kanban = ?,
                 atualizado_por_id = ?,
                 atualizado_por_perfil = ?,
                 ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [etapa, dadosAuditoria.atualizado_por_id || null, dadosAuditoria.atualizado_por_perfil || null, id]
        );
        return result.affectedRows;
    }

    static async deletarCard(id) {
        const [result] = await db.query('DELETE FROM kanban_gerencia WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = KanbanGerenciaModel;
