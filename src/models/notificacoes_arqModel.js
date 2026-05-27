const conexao = require('../config/database');

class NotificacaoArqModel {
    static async findByFuncionario(funcionarioId) {
        const [rows] = await conexao.query(
            'SELECT * FROM notificacoes_arquitetura WHERE funcionario_id = ? ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    static async findUnreadByFuncionario(funcionarioId) {
        const [rows] = await conexao.query(
            'SELECT * FROM notificacoes_arquitetura WHERE funcionario_id = ? AND lida = FALSE ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    static async countUnread(funcionarioId) {
        const [rows] = await conexao.query(
            'SELECT COUNT(*) as total FROM notificacoes_arquitetura WHERE funcionario_id = ? AND lida = FALSE',
            [funcionarioId]
        );
        return rows[0].total;
    }

    static async create(notificacao) {
        const {
            funcionario_id,
            titulo,
            mensagem,
            tipo_notificacao,
            pedido_id,
            prioridade_alerta
        } = notificacao;

        const [result] = await conexao.query(
            `INSERT INTO notificacoes_arquitetura
            (funcionario_id, titulo, mensagem, tipo_notificacao, pedido_id, lida, data_criacao)
            VALUES (?, ?, ?, ?, ?, FALSE, CURRENT_TIMESTAMP)`,
            [funcionario_id, titulo, mensagem, tipo_notificacao || 'Novo Projeto', pedido_id || null]
        );
        return result.insertId;
    }

    static async markAsRead(id) {
        const [result] = await conexao.query(
            'UPDATE notificacoes_arquitetura SET lida = TRUE WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    static async markAllAsRead(funcionarioId) {
        const [result] = await conexao.query(
            'UPDATE notificacoes_arquitetura SET lida = TRUE WHERE funcionario_id = ?',
            [funcionarioId]
        );
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await conexao.query(
            'DELETE FROM notificacoes_arquitetura WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    static async deleteOld(dias = 30) {
        const [result] = await conexao.query(
            'DELETE FROM notificacoes_arquitetura WHERE data_criacao < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [dias]
        );
        return result.affectedRows;
    }

    static async findPendingMatrizCobranca() {
        const [rows] = await conexao.query(
            `SELECT na.*, ka.pedido_id, ka.previsao_retorno_externo
             FROM notificacoes_arquitetura na
             JOIN kanban_arquitetura ka ON na.pedido_id = ka.pedido_id
             WHERE ka.requer_matriz_externa = TRUE
               AND ka.matriz_recebida_check = FALSE
               AND na.data_criacao <= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
               AND na.lida = FALSE
             ORDER BY na.data_criacao DESC`
        );
        return rows;
    }
}
