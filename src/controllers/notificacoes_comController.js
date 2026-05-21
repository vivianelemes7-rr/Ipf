const NotificacaoComService = require('../services/notificacoes_comService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoComController {
    static listar = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const dados = await NotificacaoComService.obterPainelNotificacoes(funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarLida = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await NotificacaoComService.marcarComoLida(id);
        res.status(200).json({ sucesso: true, dados: resultado });
    });

    static marcarTodasLidas = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        await NotificacaoComService.lerTudo(funcionarioId);
        res.status(200).json({
            sucesso: true,
            mensagem: 'Todas as notificações foram marcadas como lidas.'
        });
    });

    static excluir = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await NotificacaoComService.excluirNotificacao(id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    static rodarAutomacao = asyncHandler(async (req, res) => {
        const totalGerado = await NotificacaoComService.verificarEGerarAlertasDeAtraso();
        res.status(200).json({
            sucesso: true,
            mensagem: 'Automação executada com sucesso.',
            alertasGerados: totalGerado
        });
    });
}

module.exports = NotificacaoComController;
