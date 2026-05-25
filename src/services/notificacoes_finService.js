const AppError = require('../utils/AppError');
const NotificacaoFinModel = require('../models/notificacoes_finModel');
const PedidoModel = require('../models/pedidoModel');

class NotificacaoFinService {
    
    // Painel Principal: Busca notificações e o contador para o Front-end
    static async obterPainelNotificacoes(funcionarioId) {
        const lista = await NotificacaoFinModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoFinModel.countUnread(funcionarioId);

        return {
            notificacoes: lista,
            totalNaoLidas
        };
    }

    // Marcar uma notificação específica como lida
    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoFinModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: "Notificação atualizada." };
    }

    // Marcar todas as notificações do financeiro de um funcionário como lidas
    static async lerTudo(funcionarioId) {
        return await NotificacaoFinModel.markAllAsRead(funcionarioId);
    }

    // Excluir uma notificação do banco
    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoFinModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    // Método de Disparo: Usado manualmente por outros Services (ex: PedidoService, CaixaService)
    static async gerarAlerta(dados) {
        // Validação básica dos campos obrigatórios da sua tabela
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação.');
        }
        return await NotificacaoFinModel.create(dados);
    }

    // AUTOMAÇÃO: Verifica se há faturamentos/cobranças pendentes há muito tempo e avisa o financeiro
    static async verificarEGerarAlertasDeAtraso() {
        try {
            const DIAS_LIMITE = 5; // Define a regra de negócio para pendências financeiras
            
            console.log(`[Automação Financeiro] Verificando contas/pedidos pendentes há mais de ${DIAS_LIMITE} dias...`);
            
            // Busca no Model de Pedidos/Financeiro os registros que estouraram o prazo
            // (Substitua pelo método real do seu sistema quando necessário)
            const pendenciasAtrasadas = await PedidoModel.findPendingBilling(DIAS_LIMITE);
            
            if (!pendenciasAtrasadas || pendenciasAtrasadas.length === 0) {
                console.log('[Automação Financeiro] Nenhuma pendência antiga encontrada hoje.');
                return 0;
            }

            // Mapeia os registros e cria as notificações em massa
            const promessas = pendenciasAtrasadas.map(pedido => {
                return NotificacaoFinService.gerarAlerta({
                    funcionario_id: pedido.responsavel_financeiro_id, // Ou um ID fixo do setor
                    titulo: "Alerta de Cobrança Pendente",
                    mensagem: `O pedido PV-${pedido.id} aguarda liberação financeira ou faturamento há mais de ${DIAS_LIMITE} dias.`,
                    pedido_id: pedido.id,
                    tipo_alerta: 'Cobrança',
                    prioridade_alerta: 'Urgente'
                });
            });

            const resultados = await Promise.all(promessas);
            console.log(`[Automação Financeiro] ${resultados.length} notificações de cobrança geradas com sucesso.`);
            
            return resultados.length;
            
        } catch (error) {
            console.error('[Automação Financeiro] Erro na execução da varredura de pendências:', error);
            throw error;
        }
    }

    // Limpa notificações muito antigas (Ex: 60 dias)
    static async limparHistoricoAntigo() {
        try {
            return await NotificacaoFinModel.deleteOld(60);
        } catch (error) {
            throw new Error('Erro ao limpar histórico antigo de notificações financeiras: ' + error.message);
        }
    }
}

module.exports = NotificacaoFinService;