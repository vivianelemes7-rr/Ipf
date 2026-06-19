const AppError = require('../utils/AppError');
const NotificacaoProducaoModel = require('../models/notificacoes_producaoModel');
const ProducaoModel = require('../models/producaoModel');

class NotificacaoProducaoService {
    static async obterPainelNotificacoes(funcionarioId) {
        const notificacoes = await NotificacaoProducaoModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoProducaoModel.countUnread(funcionarioId);
        return { notificacoes, totalNaoLidas };
    }

    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoProducaoModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: 'Notificação atualizada.' };
    }

    static async lerTudo(funcionarioId) {
        return await NotificacaoProducaoModel.markAllAsRead(funcionarioId);
    }

    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoProducaoModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    static async gerarAlerta(dados) {
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação de produção.');
        }

        const existente = await NotificacaoProducaoModel.findDuplicateOpen(dados);
        if (existente) return existente.id;

        return await NotificacaoProducaoModel.create(dados);
    }

    static async verificarEGerarAlertasDeAtraso(diasLimite = 2) {
        const atrasados = await ProducaoModel.listarAtrasadosPorEtapa(diasLimite);
        const matrizPendente = await ProducaoModel.listarMatrizPendente(diasLimite);
        const alertas = [];

        for (const card of atrasados) {
            if (!card.responsavel_producao_id) continue;
            alertas.push(await NotificacaoProducaoService.gerarAlerta({
                funcionario_id: card.responsavel_producao_id,
                titulo: 'Atraso em etapa de produção',
                mensagem: `Pedido ${card.numero_pedido || card.pedido_id} está parado em ${card.etapa_kanban}.`,
                pedido_id: card.pedido_id,
                prioridade_alerta: 'Urgente'
            }));
        }

        for (const card of matrizPendente) {
            if (!card.responsavel_producao_id) continue;
            alertas.push(await NotificacaoProducaoService.gerarAlerta({
                funcionario_id: card.responsavel_producao_id,
                titulo: 'Matriz pendente para produção',
                mensagem: `Pedido ${card.numero_pedido || card.pedido_id} ainda aguarda matriz para iniciar a fila de corte.`,
                pedido_id: card.pedido_id,
                prioridade_alerta: 'Urgente'
            }));
        }

        return alertas.length;
    }
}

module.exports = NotificacaoProducaoService;
