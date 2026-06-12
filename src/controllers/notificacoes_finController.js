const NotificacaoFinService = require('../services/notificacoes_finService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoFinController {
    
    // Verificar saúde do servidor / módulo financeiro
    static healthCheck = asyncHandler(async (req, res) => {
        res.status(200).json({ 
            sucesso: true, 
            status: "OK", 
            timestamp: new Date(),
            mensagem: "Módulo de notificações financeiras operando normalmente." 
        });
    });

    // Lista todas as notificações e o total de não lidas do financeiro
    static listar = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const dados = await NotificacaoFinService.obterPainelNotificacoes(funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    // Marca uma notificação financeira específica como lida
    static marcarLida = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await NotificacaoFinService.marcarComoLida(id);
        res.status(200).json({ sucesso: true, dados: resultado });
    });

    // Marca todas as notificações do financeiro de um funcionário como lidas
    static marcarTodasLidas = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        await NotificacaoFinService.lerTudo(funcionarioId);
        res.status(200).json({
            sucesso: true,
            mensagem: 'Todas as notificações financeiras foram marcadas como lidas.'
        });
    });

    // Exclui uma notificação do financeiro
    static excluir = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await NotificacaoFinService.excluirNotificacao(id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    // Rota para disparar a automação financeira manualmente (Útil para testes)
    static rodarAutomacao = asyncHandler(async (req, res) => {
        const totalGerado = await NotificacaoFinService.verificarEGerarAlertasDeAtraso();
        res.status(200).json({
            sucesso: true,
            mensagem: 'Automação executada com sucesso via requisição manual.',
            alertasGerados: totalGerado
        });
    });
}

module.exports = NotificacaoFinController;