const db = require('../config/database'); // Importa a conexão pool

class NotificacaoComModel {
    // Busca todas as notificações de um funcionário específico (as mais recentes primeiro)
    static async findByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            'SELECT * FROM notificacoes_comercial WHERE funcionario_id = ? ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    // Busca apenas as notificações não lidas de um funcionário
    static async findUnreadByFuncionario(funcionarioId) {
        const [rows] = await db.query(
            'SELECT * FROM notificacoes_comercial WHERE funcionario_id = ? AND lida = FALSE ORDER BY data_criacao DESC',
            [funcionarioId]
        );
        return rows;
    }

    // Retorna apenas a contagem de mensagens não lidas
    static async countUnread(funcionarioId) {
        const [rows] = await db.query(
            'SELECT COUNT(*) as total FROM notificacoes_comercial WHERE funcionario_id = ? AND lida = FALSE',
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
            tipo_modulo, 
            item_id, 
            prioridade_alerta 
        } = notificacao;

        const [result] = await db.query(
            `INSERT INTO notificacoes_comercial 
            (funcionario_id, titulo, mensagem, tipo_modulo, item_id, prioridade_alerta) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [funcionario_id, titulo, mensagem, tipo_modulo, item_id, prioridade_alerta || 'Normal']
        );
        return result.insertId;
    }

    // Marca uma notificação como lida
    static async markAsRead(id) {
        const [result] = await db.query(
            'UPDATE notificacoes_comercial SET lida = TRUE WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    // Marca TODAS as notificações de um funcionário como lidas
    static async markAllAsRead(funcionarioId) {
        const [result] = await db.query(
            'UPDATE notificacoes_comercial SET lida = TRUE WHERE funcionario_id = ?',
            [funcionarioId]
        );
        return result.affectedRows;
    }

    // Deleta uma notificação específica
    static async delete(id) {
        const [result] = await db.query(
            'DELETE FROM notificacoes_comercial WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }

    // Deleta notificações antigas para manutenção do banco
    static async deleteOld(dias = 30) {
        const [result] = await db.query(
            'DELETE FROM notificacoes_comercial WHERE data_criacao < DATE_SUB(NOW(), INTERVAL ? DAY)',
            [dias]
        );
        return result.affectedRows;
    }

    // Busca notificações com informações básicas do Lead (para automação de leads parados)
    // Mostrar o nome do contato (lead) direto na lista de notificações
    static async findDetailedByFuncionario(funcionarioId) {
        const sql = `
            SELECT n.*, l.nome_contato as nome_lead
            FROM notificacoes_comercial n
            LEFT JOIN leads l ON n.item_id = l.id AND n.tipo_modulo = 'Vendas'
            WHERE n.funcionario_id = ?
            ORDER BY n.data_criacao DESC
        `;
        const [rows] = await db.query(sql, [funcionarioId]);
        return rows;
    }
}

module.exports = NotificacaoComModel;