const cron = require('node-cron');
const NotificacaoComService = require('./services/notificacoes_comService');

// Importe aqui os outros serviços quando criá-los:
// const NotificacaoArqService = require('./services/notificacoes_arqService');
// const NotificacaoFinService = require('./services/notificacoes_finService');

const iniciarAgendamentos = () => {
    // Verificação Diária (Roda todo dia às 06:00 da manhã)
    // Padrão: 'minuto hora dia mes dia_da_semana'
    cron.schedule('0 6 * * *', async () => {
        console.log('--- [SCHEDULER] Iniciando varredura diária de atrasos ---');
        
        try {
            // Verifica Comercial
            const comercial = await NotificacaoComService.verificarEGerarAlertasDeAtraso();
            console.log(`[COMERCIAL] ${comercial} alertas processados.`);

            // Futuramente, acrescente os outros setores aqui:
            // await NotificacaoArqService.verificarAtrasosProjetos();
            // await NotificacaoFinService.verificarParcelasAtrasadas();
            
        } catch (error) {
            console.error('--- [SCHEDULER] Erro ao processar automações:', error);
        }
    });

    // Limpeza de Banco (Roda todo domingo às 02:00 da manhã)
    cron.schedule('0 2 * * 0', async () => {
        console.log('--- [SCHEDULER] Limpando notificações antigas ---');
        await NotificacaoComService.limparHistoricoAntigo();
    });

    console.log('Agendador de tarefas iniciado com sucesso.');
};

module.exports = iniciarAgendamentos;