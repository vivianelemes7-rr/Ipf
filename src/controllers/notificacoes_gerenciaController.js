const NotificacaoGerenciaService = require('../services/notificacoes_gerenciaService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoGerenciaController {
    static healthCheck = asyncHandler(async (req, res) => {
        res.status(200).json({
            sucesso: true,
            status: 'OK',
            timestamp: new Date(),
            mensagem: 'Módulo de notificações gerenciais operando normalmente.'
        });
    });

    static listar = asyncHandler(async (req, res) => {
        const dados = await NotificacaoGerenciaService.obterPainelNotificacoes(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarLida = asyncHandler(async (req, res) => {
        const dados = await NotificacaoGerenciaService.marcarComoLida(req.params.id);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarTodasLidas = asyncHandler(async (req, res) => {
        await NotificacaoGerenciaService.lerTudo(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas.' });
    });

    static excluir = asyncHandler(async (req, res) => {
        await NotificacaoGerenciaService.excluirNotificacao(req.params.id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    static rodarAutomacao = asyncHandler(async (req, res) => {
        const alertasGerados = await NotificacaoGerenciaService.processarAlertasCriticos();
        res.status(200).json({ sucesso: true, mensagem: 'Automação executada com sucesso.', alertasGerados });
    });
}

module.exports = NotificacaoGerenciaController;
