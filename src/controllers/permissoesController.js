const PermissoesModel = require('../models/permissoesModel');
const PermissoesService = require('../services/permissoesService');
const FuncionarioModel = require('../models/funcionarioModel');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');

const PermissoesController = {
    obter: asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const permissoes = await PermissoesModel.obterPorFuncionario(funcionarioId);

        if (!permissoes) {
            throw AppError.notFound('Permissões não encontradas para este funcionário');
        }

        res.json(permissoes);
    }),

    atualizar: asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const dados = req.body;

        const erros = PermissoesService.validarPermissoes(dados);
        if (erros.length > 0) {
            throw AppError.badRequest('Dados de permissão inválidos', erros);
        }

        const permissoes = await PermissoesModel.obterPorFuncionario(funcionarioId);
        if (!permissoes) {
            throw AppError.notFound('Permissões não encontradas para este funcionário');
        }

        await PermissoesModel.atualizar(funcionarioId, dados);
        res.json({ sucesso: true, mensagem: 'Permissões atualizadas com sucesso!' });
    }),

    gerarPorCargo: asyncHandler(async (req, res) => {
        const { funcionarioId } = req.params;
        const { cargo } = req.body;

        if (!cargo) {
            throw AppError.badRequest('Cargo é obrigatório');
        }

        const funcionario = await FuncionarioModel.buscarPorId(funcionarioId);
        if (!funcionario) {
            throw AppError.notFound('Funcionário não encontrado');
        }

        const permissoes = PermissoesService.gerarPermissoesPorCargo(cargo);

        await PermissoesModel.salvarOuAtualizar(funcionarioId, permissoes);
        await FuncionarioModel.atualizarFuncionario(funcionarioId, { status_ativo: true, cargo });

        res.json({
            sucesso: true,
            mensagem: 'Permissões geradas e funcionário aprovado',
            permissoes
        });
    })
};

module.exports = PermissoesController;
