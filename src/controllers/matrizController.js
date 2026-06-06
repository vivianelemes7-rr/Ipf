const MatrizService = require('../services/matrizService');
const { asyncHandler } = require('../utils/asyncHandler');

const MatrizController = {
    verificarStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const resultado = await MatrizService.processarRegraMatriz(id);
        res.status(200).json(resultado);
    })
};

module.exports = MatrizController;
