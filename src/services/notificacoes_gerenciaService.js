const AppError = require('../utils/AppError');
const GerenciaModel = require('../models/gerenciaModel');
const NotificacaoGerenciaModel = require('../models/notificacoes_gerenciaModel');

class NotificacaoGerenciaService {
    static async obterPainelNotificacoes(funcionarioId) {
        const notificacoes = await NotificacaoGerenciaModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoGerenciaModel.countUnread(funcionarioId);
        return { notificacoes, totalNaoLidas };
    }

    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoGerenciaModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: 'Notificação atualizada.' };
    }

    static async lerTudo(funcionarioId) {
        return await NotificacaoGerenciaModel.markAllAsRead(funcionarioId);
    }

    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoGerenciaModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    static async gerarAlerta(dados) {
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação gerencial.');
        }

        const existente = await NotificacaoGerenciaModel.findDuplicateOpen(dados);
        if (existente) return existente.id;

        return await NotificacaoGerenciaModel.create(dados);
    }

    static async gerarParaGestores(dados) {
        const gestores = await GerenciaModel.buscarGestores();
        if (!gestores.length) return 0;

        let total = 0;
        for (const gestor of gestores) {
            await NotificacaoGerenciaService.gerarAlerta({ ...dados, funcionario_id: gestor.id });
            total += 1;
        }
        return total;
    }

    static async processarAlertasCriticos() {
        const [parados, slaComercial] = await Promise.all([
            GerenciaModel.listarPedidosParados(7),
            GerenciaModel.listarSlaComercialEstourado(7)
        ]);

        let total = 0;
        for (const item of parados) {
            total += await NotificacaoGerenciaService.gerarParaGestores({
                titulo: 'Pedido parado por setor',
                mensagem: `Pedido ${item.numero_pedido || item.pedido_id || 'sem pedido'} está parado em ${item.setor}/${item.etapa} há ${item.dias_parado} dias.`,
                pedido_id: item.pedido_id,
                setor: item.setor,
                tipo_alerta: 'Pedido Parado',
                prioridade_alerta: 'Urgente'
            });
        }

        for (const item of slaComercial) {
            total += await NotificacaoGerenciaService.gerarParaGestores({
                titulo: 'SLA comercial estourado',
                mensagem: `Lead ${item.nome_contato} está em ${item.etapa_kanban} há ${item.dias_parado} dias com ${item.vendedor_nome || 'vendedor sem responsável'}.`,
                pedido_id: item.pedido_id,
                setor: 'Comercial',
                tipo_alerta: 'SLA Comercial',
                prioridade_alerta: 'Urgente'
            });
        }

        return total;
    }

    static async gerarEventoFinanceiroLiberado(cardFinanceiro) {
        return await NotificacaoGerenciaService.gerarParaGestores({
            titulo: 'Financeiro liberou pedido',
            mensagem: `Pedido ${cardFinanceiro.numero_pedido || cardFinanceiro.pedido_id} foi liberado pelo financeiro.`,
            pedido_id: cardFinanceiro.pedido_id,
            setor: 'Financeiro',
            tipo_alerta: 'Liberacao Financeira',
            prioridade_alerta: 'Normal'
        });
    }

    static async gerarEventoMatrizConfirmada(dados) {
        return await NotificacaoGerenciaService.gerarParaGestores({
            titulo: 'Matriz confirmada pela arquitetura',
            mensagem: `Matriz do pedido ${dados.numero_pedido || dados.pedido_id} foi confirmada pela arquitetura.`,
            pedido_id: dados.pedido_id,
            setor: 'Arquitetura',
            tipo_alerta: 'Matriz Confirmada',
            prioridade_alerta: 'Normal'
        });
    }

    static async gerarEventoProducaoFinalizada(card) {
        return await NotificacaoGerenciaService.gerarParaGestores({
            titulo: 'Produção finalizada',
            mensagem: `Pedido ${card.numero_pedido || card.pedido_id} foi finalizado na produção.`,
            pedido_id: card.pedido_id,
            setor: 'Producao',
            tipo_alerta: 'Producao Finalizada',
            prioridade_alerta: 'Normal'
        });
    }
}

module.exports = NotificacaoGerenciaService;
