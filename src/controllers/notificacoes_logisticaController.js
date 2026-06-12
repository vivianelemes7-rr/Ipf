const NotificacaoLogisticaService = require('../services/notificacoes_logisticaService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoLogisticaController {
    static healthCheck = asyncHandler(async (req, res) => {
        res.status(200).json({
            sucesso: true,
            status: 'OK',
            timestamp: new Date(),
            mensagem: 'Módulo de notificações de logística operando normalmente.'
        });
    });

    static listar = asyncHandler(async (req, res) => {
        const dados = await NotificacaoLogisticaService.obterPainelNotificacoes(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarLida = asyncHandler(async (req, res) => {
        const dados = await NotificacaoLogisticaService.marcarComoLida(req.params.id);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarTodasLidas = asyncHandler(async (req, res) => {
        await NotificacaoLogisticaService.lerTudo(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas.' });
    });

    static excluir = asyncHandler(async (req, res) => {
        await NotificacaoLogisticaService.excluirNotificacao(req.params.id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    static rodarAutomacao = asyncHandler(async (req, res) => {
        const totalGerado = await NotificacaoLogisticaService.verificarEGerarAlertasDeAtraso(req.body?.dias_limite);
        res.status(200).json({
            sucesso: true,
            mensagem: 'Automação de logística executada com sucesso.',
            alertasGerados: totalGerado
        });
    });
}

module.exports = NotificacaoLogisticaController;
