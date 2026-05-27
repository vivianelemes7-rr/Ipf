const AppError = require('../utils/AppError');
const NotificacaoArqModel = require('../models/notificacoes_arqModel');

class NotificacaoArqService {

    static async obterPainelNotificacoes(funcionarioId) {
        const lista = await NotificacaoArqModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoArqModel.countUnread(funcionarioId);
        return {
            notificacoes: lista,
            totalNaoLidas
        };
    }

    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoArqModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: 'Notificação atualizada.' };
    }

    static async lerTudo(funcionarioId) {
        return await NotificacaoArqModel.markAllAsRead(funcionarioId);
    }

    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoArqModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    static async gerarAlerta(dados) {
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação.');
        }
        return await NotificacaoArqModel.create(dados);
    }

    static async verificarAtrasosProjetos() {
        try {
            const DIAS_LIMITE = 3;
            console.log(`[Automação Arquitetura] Verificando matrizes externas pendentes há mais de ${DIAS_LIMITE} dias...`);

            const pendencias = await NotificacaoArqModel.findPendingMatrizCobranca();

            if (!pendencias || pendencias.length === 0) {
                console.log('[Automação Arquitetura] Nenhuma pendência encontrada hoje.');
                return 0;
            }

            const promessas = pendencias.map(pendencia => {
                return NotificacaoArqService.gerarAlerta({
                    funcionario_id: pendencia.funcionario_id,
                    titulo: 'Cobrança de Matriz Extern
