const NotificacaoArqService = require('../services/notificacoes_arqService');
const { asyncHandler } = require('../utils/asyncHandler');

class NotificacaoArqController {

    static healthCheck = asyncHandler(async (req, res) => {
        return res.status(200).json({
            sucesso: true,
            status: 'OK',
            timestamp: new Date(),
            mensagem: 'Módulo de notificações de arquitetura operando normalmente.'
        });
    });

    static listar = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const dados = await NotificacaoArqService.obterPainelNotificacoes(funcionarioId);
        res.status(200).json({ sucesso: true, dados });
    });

    static marcarLida = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await NotificacaoArqService.marcarComoLida(id);
        res.status(200).json({ sucesso: true, dados: resultado });
    });

    static marcarTodasLidas = asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        await NotificacaoArqService.lerTudo(funcionarioId);
        res.status(200).json({
            sucesso: true,
            mensagem: 'Todas as notificações foram marcadas como lidas.'
        });
    });

    static excluir = asyncHandler(async (req, res) => {
        const { id } = req.params;
        await NotificacaoArqService.excluirNotificacao(id);
        res.status(200).json({ sucesso: true, mensagem: 'Notificação excluída com sucesso.' });
    });

    static rodarAutomacao = asyncHandler(async (req, res) => {
        const totalGerado = await NotificacaoArqService.verificarAtrasosProjetos();
        res.status(200).json({
            sucesso: true,
            mensagem: 'Automação executada com sucesso.',
            alertasGerados: totalGerado
        });
    });
}

module.exports = NotificacaoArqController;
