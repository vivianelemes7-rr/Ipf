const ProducaoService = require('../services/producaoService');

const ProducaoController = {
    // Função para mover o pedido de etapa
    moverPedido: async (req, res) => {
        try {
            const { id } = req.params;
            const resultado = await ProducaoService.moverParaProducao(id);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Função para buscar a lista da fábrica
    listarFila: async (req, res) => {
        try {
            const fila = await ProducaoService.listarFilaCompleta(); // Chame o método do service aqui
            res.status(200).json(fila);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = ProducaoController;

