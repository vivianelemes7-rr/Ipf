const FuncionarioModel = require('../models/funcionarioModel');
const AutenticacaoService = require('../services/autenticacaoService');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const CAMPOS_EDITAVEIS = ['nome', 'email', 'cargo', 'departamento', 'status_ativo', 'senha'];

const FuncionarioController = {
    listar: asyncHandler(async (req, res) => {
        const lista = await FuncionarioModel.listarTodos();
        res.json(lista);
    }),

    editar: asyncHandler(async (req, res) => {
        const { senha, password, ...resto } = req.body;
        const dados = {};

        for (const campo of CAMPOS_EDITAVEIS) {
            if (resto[campo] !== undefined) dados[campo] = resto[campo];
        }

        const senhaBody = password || senha;
        if (senhaBody) {
            dados.senha = await AutenticacaoService.criptografarSenha(senhaBody);
        }

        if (Object.keys(dados).length === 0) {
            throw AppError.badRequest('Nenhum campo válido para atualizar');
        }

        const afetados = await FuncionarioModel.atualizarFuncionario(req.params.id, dados);
        if (!afetados) {
            throw AppError.notFound('Funcionário não encontrado');
        }

        logger.info('FUNCIONARIO', `Atualizado id=${req.params.id}`);
        res.json({ sucesso: true, mensagem: 'Dados atualizados!' });
    }),

    excluir: asyncHandler(async (req, res) => {
        const ok = await FuncionarioModel.deletar(req.params.id);
        if (!ok) {
            throw AppError.notFound('Funcionário não encontrado');
        }
        logger.info('FUNCIONARIO', `Removido id=${req.params.id}`);
        res.json({ sucesso: true, mensagem: 'Removido com sucesso!' });
    })
};

module.exports = FuncionarioController;
