const MatrizModel = require('../models/matrizModel');

const MatrizService = {
    processarRegraMatriz: async (pedidoId) => {
        const dados = await MatrizModel.getMatrizStatus(pedidoId);
        
        if (!dados) throw new Error('Pedido não encontrado');

        let statusFinal = 'Em processamento';
        const isEspecial = dados.tipo_pedido === 'Especial';

        // Regra: Se for especial e a matriz externa ainda não chegou
        if (isEspecial && dados.requer_matriz_externa && !dados.matriz_recebida_check) {
            statusFinal = 'Aguardando Matriz Externa';
        }

        return {
            isEspecial,
            status: statusFinal,
            detalhes: dados
        };
    }
};

module.exports = MatrizService;

