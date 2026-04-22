const MatrizService = require('../services/matrizService');

const MatrizController = {
    verificarStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const resultado = await MatrizService.processarRegraMatriz(id);
            res.status(200).json(resultado);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = MatrizController;

