const ClienteService = require('../services/clienteService');
const { asyncHandler } = require('../utils/asyncHandler');

const ClienteController = {
    listar: asyncHandler(async (req, res) => {
        const clientes = await ClienteService.listarClientes(req.query);
        res.status(200).json(clientes);
    }),

    buscarPorId: asyncHandler(async (req, res) => {
        const cliente = await ClienteService.buscarCliente(req.params.id);
        res.status(200).json(cliente);
    }),

    criar: asyncHandler(async (req, res) => {
        const resultado = await ClienteService.criarCliente(req.body);
        res.status(201).json({
            sucesso: true,
            mensagem: 'Cliente criado com sucesso.',
            id: resultado.insertId
        });
    }),

    atualizar: asyncHandler(async (req, res) => {
        const cliente = await ClienteService.atualizarCliente(req.params.id, req.body);
        res.status(200).json(cliente);
    }),

    converter: asyncHandler(async (req, res) => {
        const cliente = await ClienteService.converterLead(req.params.id);
        res.status(200).json(cliente);
    }),

    arquivar: asyncHandler(async (req, res) => {
        await ClienteService.arquivarCliente(req.params.id);
        res.status(200).json({ sucesso: true, mensagem: 'Cliente arquivado com sucesso.' });
    })
};

module.exports = ClienteController;
