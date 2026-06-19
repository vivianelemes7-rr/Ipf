const db = require('../config/database');

class NotificacaoProducaoModel {
    static async findByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            'SELECT * FROM notificacoes_producao WHERE funcionario_id = ? ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    static async countUnread(funcionarioId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) AS total FROM notificacoes_producao WHERE funcionario_id = ? AND lida = FALSE',
            [funcionarioId]
        );
        return rows[0].total;
    }

    static async findDuplicateOpen(notificacao) {
        const [rows] = await db.query(
            `SELECT id
             FROM notificacoes_producao
             WHERE funcionario_id = ?
               AND pedido_id = ?
               AND titulo = ?
               AND lida = FALSE
             LIMIT 1`,
            [notificacao.funcionario_id, notificacao.pedido_id || null, notificacao.titulo]
        );
        return rows[0] || null;
    }

    static async create(notificacao) {
        const [result] = await db.query(
            `INSERT INTO notificacoes_producao
             (funcionario_id, titulo, mensagem, pedido_id, prioridade_alerta)
             VALUES (?, ?, ?, ?, ?)`,
            [
                notificacao.funcionario_id,
                notificacao.titulo,
                notificacao.mensagem,
                notificacao.pedido_id || null,
                notificacao.prioridade_alerta || 'Normal'
            ]
        );
        return result.insertId;
    }

    static async markAsRead(id) {
        const [result] = await db.query('UPDATE notificacoes_producao SET lida = TRUE WHERE id = ?', [id]);
        return result.affectedRows;
    }

    static async markAllAsRead(funcionarioId) {
        const [result] = await db.query(
            'UPDATE notificacoes_producao SET lida = TRUE WHERE funcionario_id = ?',
            [funcionarioId]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM notificacoes_producao WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = NotificacaoProducaoModel;
