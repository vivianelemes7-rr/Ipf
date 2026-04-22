const ProducaoModel = require('../models/producaoModel');

const ProducaoService = {
    moverParaProducao: async (pedidoId) => {
        // Marca como concluído na arquitetura e "manda" para a produção
        await ProducaoModel.atualizarStatusFila('kanban_arquitetura', pedidoId, 'Concluído');
        
        return { 
            sucesso: true, 
            mensagem: `Pedido ${pedidoId} enviado para a fábrica!` 
        };
    }
};

module.exports = ProducaoService;

