const NotificacaoProducaoService = require('../services/notificacoes_producaoService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoProducaoController {
    static healthCheck = asyncHandler(async (req, res) => {
        res.status(200).json({
            sucesso: true,
            status: 'OK',
            timestamp: new Date(),
            mensagem: 'Módulo de notificações de produção operando normalmente.'
        });
    });

    static listar = asyncHandler(async (req, res) => {
        const dados = await NotificacaoProducaoService.obterPainelNotificacoes(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarLida = asyncHandler(async (req, res) => {
        const dados = await NotificacaoProducaoService.marcarComoLida(req.params.id);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarTodasLidas = asyncHandler(async (req, res) => {
        await NotificacaoProducaoService.lerTudo(req.params.funcionarioId);
        res.status(200).json({ sucesso: true, mensagem: 'Todas as notificações foram marcadas como lidas.' });
    });

    static excluir = asyncHandler(async (req, res) => {
        await NotificacaoProducaoService.excluirNotificacao(req.params.id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    static rodarAutomacao = asyncHandler(async (req, res) => {
        const totalGerado = await NotificacaoProducaoService.verificarEGerarAlertasDeAtraso(req.body?.dias_limite);
        res.status(200).json({
            sucesso: true,
            mensagem: 'Automação executada com sucesso.',
            alertasGerados: totalGerado
        });
    });
}

module.exports = NotificacaoProducaoController;
