const db = require('../config/database');

class NotificacaoLogisticaModel {
    static async findByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            `SELECT * FROM notificacoes_logistica
             WHERE funcionario_id = ?
             ORDER BY data_criacao DESC`,
            [funcionarioId]
        );
        return rows;
    }

    static async countUnread(funcionarioId) {
        const [rows] = await db.query(
            `SELECT COUNT(*) AS total FROM notificacoes_logistica
             WHERE funcionario_id = ? AND lida = FALSE`,
            [funcionarioId]
        );
        return rows[0].total;
    }

    static async findDuplicateOpen(notificacao) {
        const [rows] = await db.query(
            `SELECT id
             FROM notificacoes_logistica
             WHERE funcionario_id = ?
               AND COALESCE(kanban_logistica_id, 0) = COALESCE(?, 0)
               AND tipo_alerta = ?
               AND titulo = ?
               AND lida = FALSE
             LIMIT 1`,
            [
                notificacao.funcionario_id,
                notificacao.kanban_logistica_id || null,
                notificacao.tipo_alerta || null,
                notificacao.titulo
            ]
        );
        return rows[0] || null;
    }

    static async create(notificacao) {
        const [result] = await db.query(
            `INSERT INTO notificacoes_logistica
             (funcionario_id, titulo, mensagem, kanban_logistica_id, tipo_alerta, prioridade_alerta)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                notificacao.funcionario_id,
                notificacao.titulo,
                notificacao.mensagem,
                notificacao.kanban_logistica_id || null,
                notificacao.tipo_alerta || null,
                notificacao.prioridade_alerta || 'Normal'
            ]
        );
        return result.insertId;
    }

    static async markAsRead(id) {
        const [result] = await db.query(
            'UPDATE notificacoes_logistica SET lida = TRUE WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    static async markAllAsRead(funcionarioId) {
        const [result] = await db.query(
            'UPDATE notificacoes_logistica SET lida = TRUE WHERE funcionario_id = ?',
            [funcionarioId]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM notificacoes_logistica WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    static async buscarCardsEmAtraso(diasLimite = 3) {
        const [rows] = await db.query(
            `SELECT kl.id, kl.titulo, kl.cliente_nome, kl.vendedor_nome,
                    kl.etapa_kanban, kl.ultima_atualizacao,
                    DATEDIFF(NOW(), kl.ultima_atualizacao) AS dias_parado
             FROM kanban_logistica kl
             WHERE kl.etapa_kanban IN ('Pronto para Envio', 'Em Expedicao')
               AND kl.ultima_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY kl.ultima_atualizacao ASC`,
            [diasLimite]
        );
        return rows;
    }

    static async buscarFuncionariosLogistica() {
        const [rows] = await db.query(
            `SELECT f.id, f.nome, f.cargo
             FROM funcionarios f
             WHERE LOWER(f.cargo) IN ('logistica', 'logístico', 'logístico', 'administrador')
               AND f.ativo = TRUE`,
        );
        return rows;
    }
}

module.exports = NotificacaoLogisticaModel;
