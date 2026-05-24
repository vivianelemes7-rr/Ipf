const AppError = require('../utils/AppError');
const NotificacaoModel = require('../models/notificacoes_comModel');
const CRMModel = require('../models/crm_comercialModel');

class NotificacaoComService {
    
    // Painel Principal: Busca notificações e o contador para o Front-end
    static async obterPainelNotificacoes(funcionarioId) {
        const lista = await NotificacaoModel.findByFuncionario(funcionarioId);
        const totalNaoLidas = await NotificacaoModel.countUnread(funcionarioId);

        return {
            notificacoes: lista,
            totalNaoLidas
        };
    }

    // Marcar uma notificação específica como lida
    static async marcarComoLida(id) {
        const affectedRows = await NotificacaoModel.markAsRead(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Notificação não encontrada ou já lida.');
        }
        return { success: true, message: "Notificação atualizada." };
    }

    // Marcar todas as notificações do comercial de um funcionário como lidas
    static async lerTudo(funcionarioId) {
        return await NotificacaoModel.markAllAsRead(funcionarioId);
    }

    // Excluir uma notificação do banco
    static async excluirNotificacao(id) {
        const affectedRows = await NotificacaoModel.delete(id);
        if (affectedRows === 0) {
            throw AppError.notFound('Não foi possível excluir: notificação não encontrada.');
        }
        return { success: true };
    }

    // Método de Disparo: Usado manualmente por outros Services (ex: PedidoService)
    static async gerarAlerta(dados) {
        // Validação básica dos campos obrigatórios da sua tabela
        if (!dados.funcionario_id || !dados.titulo || !dados.mensagem) {
            throw AppError.badRequest('Campos obrigatórios ausentes para gerar notificação.');
        }
        return await NotificacaoModel.create(dados);
    }

    // AUTOMAÇÃO: Verifica se há cards parados há mais de X dias e gera alertas automaticamente (Ex: 2 dias)
    static async verificarEGerarAlertasDeAtraso() {
        try {
            const DIAS_LIMITE = 2; // Define a regra de negócio para o CRM Comercial
            
            console.log(`[Automação] Verificando cards parados há mais de ${DIAS_LIMITE} dias...`);
            
            // Busca no Model do CRM os leads que estouraram o prazo
            const leadsAtrasados = await CRMModel.findIdleLeads(DIAS_LIMITE);
            
            if (!leadsAtrasados || leadsAtrasados.length === 0) {
                console.log('[Automação] Nenhum lead atrasado encontrado hoje.');
                return 0;
            }

            // Mapeia os leads e cria as notificações em massa chamando o método static interno da classe
            const promessas = leadsAtrasados.map(lead => {
                return NotificacaoComService.gerarAlerta({
                    funcionario_id: lead.vendedor_id,
                    titulo: "Alerta de Inatividade",
                    mensagem: `O lead "${lead.nome_contato}" está na etapa "${lead.etapa_kanban}" por muito tempo. Verifique a negociação.`,
                    tipo_modulo: 'Vendas',
                    item_id: lead.id,
                    prioridade_alerta: 'Urgente'
                });
            });

            const resultados = await Promise.all(promessas);
            console.log(`[Automação] ${resultados.length} notificações de atraso geradas com sucesso.`);
            
            return resultados.length;
            
        } catch (error) {
            console.error('[Automação] Erro na execução da varredura de atrasos:', error);
            throw error; // Repassa o erro para o Scheduler conseguir capturar no bloco try/catch dele
        }
    }

    // Limpa notificações muito antigas (Ex: 60 dias)
    static async limparHistoricoAntigo() {
        try {
            return await NotificacaoModel.deleteOld(60);
        } catch (error) {
            throw new Error('Erro ao limpar histórico antigo de notificações: ' + error.message);
        }
    }
}

module.exports = NotificacaoComService;