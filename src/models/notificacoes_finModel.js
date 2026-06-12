const db = require('../config/database'); // Importa a conexão pool

class NotificacaoFinModel {
    // Criar notificações

    // Busca todas as notificações de um funcionário específico (as mais recentes primeiro)
    static async findByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            'SELECT * FROM notificacoes_financeiro WHERE funcionario_id = ? ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    // Busca apenas as notificações não lidas de um funcionário
    static async findUnreadByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            'SELECT * FROM notificacoes_financeiro WHERE funcionario_id = ? AND lida = FALSE ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    // Retorna apenas a contagem de mensagens não lidas
    static async countUnread(funcionarioId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM notificacoes_financeiro WHERE funcionario_id = ? AND lida = FALSE',
            [funcionarioId]
        );
        return rows[0].total;
    }

    // Cria uma nova notificação
    static async create(notificacao) {
        const { 
            funcionario_id, 
            titulo, 
            mensagem, 
            pedido_id, 
            tipo_alerta, 
            prioridade_alerta 
        } = notificacao;

        const [result] = await db.query(
            `INSERT INTO notificacoes_financeiro 
            (funcionario_id, titulo, mensagem, pedido_id, tipo_alerta, prioridade_alerta) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [funcionario_id, titulo, mensagem, pedido_id, tipo_alerta, prioridade_alerta || 'Normal']
        );
        return result.insertId;
    }

    // Marca uma notificação como lida
    static async markAsRead(id) {
        const [result] = await db.query(
            'UPDATE notificacoes_financeiro SET lida = TRUE WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    // Marca TODAS as notificações de um funcionário como lidas
    static async markAllAsRead(funcionarioId) {
        const [result] = await db.query(
            'UPDATE notificacoes_financeiro SET lida = TRUE WHERE funcionario_id = ?',
            [funcionarioId]
        );
        return result.affectedRows;
    }

    // Deleta uma notificação específica
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM notificacoes_financeiro WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    // Deleta notificações antigas para manutenção do banco
    static async deleteOld(dias = 30) {
        const [result] = await db.query(
            'DELETE FROM notificacoes_financeiro WHERE data_criacao < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [dias]
        );
        return result.affectedRows;
    }

    // Busca notificações com informações básicas do Pedido
    static async findDetailedByFuncionario(funcionarioId) {
        const sql = `SELECT n.*, p.id as codigo_pedido
            FROM notificacoes_financeiro n
            LEFT JOIN pedidos p ON n.pedido_id = p.id
            WHERE n.funcionario_id = ?
            ORDER BY n.data_criacao DESC`;
        const [rows] = await db.query(sql, [funcionarioId]);
        return rows;
    }
}

module.exports = NotificacaoFinModel;