const NotificacaoComService = require('../services/notificacoes_comService');

class NotificacaoComController {
    // Lista todas as notificações e o total de não lidas
    static async listar(req, res) {
        try {
            const { funcionarioId } = req.params;
            const dados = await NotificacaoComService.obterPainelNotificacoes(funcionarioId);
            return res.status(200).json(dados);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Marca uma notificação específica como lida
    static async marcarLida(req, res) {
        try {
            const { id } = req.params;
            const resultado = await NotificacaoComService.marcarComoLida(id);
            return res.status(200).json(resultado);
        } catch (error) {
            return res.status(404).json({ error: error.message });
        }
    }

    // Marca todas as notificações de um funcionário como lidas
    static async marcarTodasLidas(req, res) {
        try {
            const { funcionarioId } = req.params;
            await NotificacaoComService.lerTudo(funcionarioId);
            return res.status(200).json({ message: "Todas as notificações foram marcadas como lidas." });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Exclui uma notificação
    static async excluir(req, res) {
        try {
            const { id } = req.params;
            await NotificacaoComService.excluirNotificacao(id);
            return res.status(200).json({ message: "Notificação excluída com sucesso." });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Rota para disparar a automação manualmente (Útil para testes)
    static async rodarAutomacao(req, res) {
        try {
            const totalGerado = await NotificacaoComService.verificarEGerarAlertasDeAtraso();
            return res.status(200).json({ 
                message: "Automação executada com sucesso.", 
                alertasGerados: totalGerado 
            });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = NotificacaoComController;