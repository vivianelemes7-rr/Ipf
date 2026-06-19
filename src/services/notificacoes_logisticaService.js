const AppError = require('../utils/AppError');
const NotificacaoLogisticaModel = require('../models/notificacoes_logisticaModel');

class NotificacaoLogisticaService {
    // ─────────────────────────────────────────────────────────
    // Painel de notificações do funcionário
    // ─────────────────────────────────────────────────────────
    static async obterPainelNotificacoes(funcionarioId) {
        const notificacoes = await NotificacaoLogisticaModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoLogisticaModel.countUnread(funcionarioId);
        return { notificacoes, totalNaoLidas };
    }

    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoLogisticaModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: 'Notificação atualizada.' };
    }

    static async lerTudo(funcionarioId) {
        return await NotificacaoLogisticaModel.markAllAsRead(funcionarioId);
    }

    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoLogisticaModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    // ─────────────────────────────────────────────────────────
    // Geração de alertas individuais (com deduplicação)
    // ─────────────────────────────────────────────────────────
    static async gerarAlerta(dados) {
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação de logística.');
        }

        const existente = await NotificacaoLogisticaModel.findDuplicateOpen(dados);
        if (existente) return existente.id;

        return await NotificacaoLogisticaModel.create(dados);
    }

    // Gera a mesma notificação para todos os funcionários de logística
    static async gerarParaEquipeLogistica(dados) {
        const funcionarios = await NotificacaoLogisticaModel.buscarFuncionariosLogistica();
        if (!funcionarios.length) return 0;

        let total = 0;
        for (const func of funcionarios) {
            await NotificacaoLogisticaService.gerarAlerta({
                ...dados,
                funcionario_id: func.id
            });
            total += 1;
        }
        return total;
    }

    // ─────────────────────────────────────────────────────────
    // Automações — chamadas pelo scheduler diário
    // ─────────────────────────────────────────────────────────

    /**
     * Verifica cards parados em "Pronto para Envio" ou "Em Expedicao"
     * por mais de {diasLimite} dias e gera alertas de atraso.
     */
    static async verificarEGerarAlertasDeAtraso(diasLimite = 3) {
        const cardsAtrasados = await NotificacaoLogisticaModel.buscarCardsEmAtraso(diasLimite);
        const alertas = [];

        for (const card of cardsAtrasados) {
            const etapaDescricao = card.etapa_kanban === 'Pronto para Envio'
                ? 'aguardando envio'
                : 'em expedição';

            alertas.push(
                await NotificacaoLogisticaService.gerarParaEquipeLogistica({
                    titulo: 'Card de logística parado',
                    mensagem: `O card "${card.titulo || `#${card.id}`}"` +
                        `${card.cliente_nome ? ` (${card.cliente_nome})` : ''}` +
                        ` está ${etapaDescricao} há ${card.dias_parado} dias sem movimentação.`,
                    kanban_logistica_id: card.id,
                    tipo_alerta: 'Atraso Logistica',
                    prioridade_alerta: card.dias_parado >= 7 ? 'Urgente' : 'Normal'
                })
            );
        }

        return alertas.length;
    }

    // ─────────────────────────────────────────────────────────
    // Eventos pontuais — chamados por outros serviços
    // ─────────────────────────────────────────────────────────

    /**
     * Notifica a logística quando um pedido é finalizado na produção
     * e está pronto para ser despachado.
     */
    static async gerarEventoProntoPraExpedicao(card) {
        return await NotificacaoLogisticaService.gerarParaEquipeLogistica({
            titulo: 'Pedido pronto para expedição',
            mensagem: `O pedido "${card.titulo || card.numero_pedido || `#${card.id}`}"` +
                `${card.cliente_nome ? ` do cliente ${card.cliente_nome}` : ''}` +
                ` foi finalizado na produção e está pronto para despacho.`,
            kanban_logistica_id: card.id,
            tipo_alerta: 'Pronto para Expedicao',
            prioridade_alerta: 'Normal'
        });
    }

    /**
     * Notifica a logística quando a entrega foi confirmada (card movido para "Entregue").
     */
    static async gerarEventoEntregaConfirmada(card) {
        return await NotificacaoLogisticaService.gerarParaEquipeLogistica({
            titulo: 'Entrega confirmada',
            mensagem: `A entrega do card "${card.titulo || card.numero_pedido || `#${card.id}`}"` +
                `${card.cliente_nome ? ` ao cliente ${card.cliente_nome}` : ''}` +
                ` foi registrada como concluída.`,
            kanban_logistica_id: card.id,
            tipo_alerta: 'Entrega Confirmada',
            prioridade_alerta: 'Normal'
        });
    }

    /**
     * Notifica a logística quando um novo card é criado para expedição.
     */
    static async gerarEventoNovoCard(card) {
        return await NotificacaoLogisticaService.gerarParaEquipeLogistica({
            titulo: 'Novo card na fila de logística',
            mensagem: `Um novo card "${card.titulo || `#${card.id}`}"` +
                `${card.cliente_nome ? ` (${card.cliente_nome})` : ''}` +
                ` foi adicionado à fila de logística. Vendedor: ${card.vendedor_nome || 'não informado'}.`,
            kanban_logistica_id: card.id,
            tipo_alerta: 'Novo Card',
            prioridade_alerta: 'Normal'
        });
    }
}

module.exports = NotificacaoLogisticaService;
