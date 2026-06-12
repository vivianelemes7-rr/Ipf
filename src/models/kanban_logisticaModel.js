const db = require('../config/database');

const CAMPOS_ATUALIZAVEIS = [
    'etapa_kanban',
    'titulo',
    'detalhes_json',
    'observacoes',
    'vendedor_nome',
    'numero_pedido',
    'cliente_nome',
    'numero_nf',
    'tipo_envio',
    'transportadora',
    'process_tag',
    'atualizado_por_perfil'
];

function selectLogisticaCompleta() {
    return `
        SELECT
            kl.id,
            kl.etapa_kanban,
            kl.titulo,
            kl.detalhes_json,
            kl.observacoes,
            kl.vendedor_nome,
            kl.numero_pedido,
            kl.cliente_nome,
            kl.numero_nf,
            kl.tipo_envio,
            kl.transportadora,
            kl.process_tag,
            kl.pedido_id,
            kl.criado_por_perfil,
            kl.atualizado_por_perfil,
            kl.data_criacao,
            kl.ultima_atualizacao
        FROM kanban_logistica kl
    `;
}

class KanbanLogisticaModel {
    static async listarCards(filtros = {}) {
        const where = [];
        const params = [];

        if (filtros.etapa_kanban) {
            where.push('kl.etapa_kanban = ?');
            params.push(filtros.etapa_kanban);
        }

        const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [rows] = await db.query(
            `${selectLogisticaCompleta()} ${sqlWhere}
             ORDER BY kl.ultima_atualizacao DESC, kl.id DESC`,
            params
        );
        return rows;
    }

    static async buscarPorId(id) {
        const [rows] = await db.query(
            `${selectLogisticaCompleta()} WHERE kl.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async criarCard(dados) {
        const [result] = await db.query(
            `INSERT INTO kanban_logistica (
                etapa_kanban,
                titulo,
                detalhes_json,
                observacoes,
                vendedor_nome,
                numero_pedido,
                cliente_nome,
                numero_nf,
                tipo_envio,
                transportadora,
                process_tag,
                pedido_id,
                criado_por_perfil,
                atualizado_por_perfil
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.etapa_kanban || 'Pronto para Envio',
                dados.titulo || 'Pedido sem título',
                dados.detalhes_json || null,
                dados.observacoes || null,
                dados.vendedor_nome || 'Não informado',
                dados.numero_pedido || null,
                dados.cliente_nome || null,
                dados.numero_nf || null,
                dados.tipo_envio || 'Transportadora',
                dados.transportadora || null,
                dados.process_tag || 'normal',
                dados.pedido_id || null,
                dados.criado_por_perfil || null,
                dados.atualizado_por_perfil || null
            ]
        );
        return result;
    }

    static async atualizarCard(id, dados) {
        const campos = CAMPOS_ATUALIZAVEIS.filter(
            (campo) => Object.prototype.hasOwnProperty.call(dados, campo)
        );
        if (campos.length === 0) return 0;

        const sets = campos.map((campo) => `${campo} = ?`).join(', ');
        const params = campos.map((campo) => dados[campo]);
        params.push(id);

        const [result] = await db.query(
            `UPDATE kanban_logistica
             SET ${sets}, ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            params
        );
        return result.affectedRows;
    }

    static async atualizarEtapa(id, etapa, dadosAuditoria = {}) {
        const [result] = await db.query(
            `UPDATE kanban_logistica
             SET etapa_kanban = ?,
                 atualizado_por_perfil = ?,
                 ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [etapa, dadosAuditoria.atualizado_por_perfil || null, id]
        );
        return result.affectedRows;
    }

    static async deletarCard(id) {
        const [result] = await db.query(
            'DELETE FROM kanban_logistica WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }
}

module.exports = KanbanLogisticaModel;
