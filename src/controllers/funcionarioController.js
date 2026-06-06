const FuncionarioModel = require('../models/funcionarioModel');
const PermissoesModel = require('../models/permissoesModel');
const AutenticacaoService = require('../services/autenticacaoService');
const PermissoesService = require('../services/permissoesService');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const CAMPOS_EDITAVEIS = ['nome', 'email', 'cargo', 'departamento', 'status_ativo', 'senha'];
const CAMPOS_EDITAVEIS_VENDEDOR = ['nome', 'email', 'departamento', 'status_ativo', 'senha'];

function isVendedor(funcionario) {
    return AutenticacaoService.normalizarCargo(funcionario?.cargo) === 'vendedor';
}

async function buscarVendedorOuFalhar(id) {
    const funcionario = await FuncionarioModel.buscarPorId(id);
    if (!funcionario || !isVendedor(funcionario)) {
        throw AppError.notFound('Vendedor não encontrado');
    }
    return funcionario;
}

const FuncionarioController = {
    listar: asyncHandler(async (req, res) => {
        const lista = await FuncionarioModel.listarTodos();
        res.json(lista);
    }),

    listarVendedores: asyncHandler(async (req, res) => {
        const lista = await FuncionarioModel.listarPorCargo('Vendedor');
        res.json(lista);
    }),

    criarVendedor: asyncHandler(async (req, res) => {
        const { nome, email, departamento } = req.body;
        const senha = req.body.password || req.body.senha;

        const existente = await FuncionarioModel.buscarPorEmail(email);
        if (existente) {
            throw AppError.conflict('E-mail já cadastrado');
        }

        const senhaHash = await AutenticacaoService.criptografarSenha(senha);
        const funcionarioId = await FuncionarioModel.criar({
            nome,
            email,
            senha: senhaHash,
            cargo: AutenticacaoService.formatarCargoParaBanco('vendedor'),
            departamento: departamento || 'Vendas',
            status_ativo: true
        });

        await PermissoesModel.criar(
            funcionarioId,
            PermissoesService.gerarPermissoesPorCargo('vendedor')
        );

        logger.info('FUNCIONARIO', `Vendedor criado id=${funcionarioId}`);
        res.status(201).json({ sucesso: true, id: funcionarioId, mensagem: 'Vendedor criado com sucesso!' });
    }),

    editar: asyncHandler(async (req, res) => {
        const { senha, password, ...resto } = req.body;
        const dados = {};

        for (const campo of CAMPOS_EDITAVEIS) {
            if (resto[campo] !== undefined) dados[campo] = resto[campo];
        }

        let cargoAtualizado = null;
        if (dados.cargo !== undefined) {
            dados.cargo = AutenticacaoService.formatarCargoParaBanco(dados.cargo);
            cargoAtualizado = dados.cargo;
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

        if (cargoAtualizado) {
            await PermissoesModel.salvarOuAtualizar(
                req.params.id,
                PermissoesService.gerarPermissoesPorCargo(cargoAtualizado)
            );
        }

        logger.info('FUNCIONARIO', `Atualizado id=${req.params.id}`);
        res.json({ sucesso: true, mensagem: 'Dados atualizados!' });
    }),

    editarVendedor: asyncHandler(async (req, res) => {
        await buscarVendedorOuFalhar(req.params.id);

        const { senha, password, cargo, ...resto } = req.body;
        if (cargo !== undefined && AutenticacaoService.normalizarCargo(cargo) !== 'vendedor') {
            throw AppError.badRequest('Gerentes só podem manter cargo de vendedor');
        }

        const dados = {};
        for (const campo of CAMPOS_EDITAVEIS_VENDEDOR) {
            if (resto[campo] !== undefined) dados[campo] = resto[campo];
        }

        const senhaBody = password || senha;
        if (senhaBody) {
            dados.senha = await AutenticacaoService.criptografarSenha(senhaBody);
        }

        if (Object.keys(dados).length === 0) {
            throw AppError.badRequest('Nenhum campo válido para atualizar');
        }

        await FuncionarioModel.atualizarFuncionario(req.params.id, dados);
        logger.info('FUNCIONARIO', `Vendedor atualizado id=${req.params.id}`);
        res.json({ sucesso: true, mensagem: 'Vendedor atualizado com sucesso!' });
    }),

    ativarVendedor: asyncHandler(async (req, res) => {
        await buscarVendedorOuFalhar(req.params.id);
        await FuncionarioModel.atualizarFuncionario(req.params.id, { status_ativo: true });
        res.json({ sucesso: true, mensagem: 'Vendedor ativado com sucesso!' });
    }),

    desativarVendedor: asyncHandler(async (req, res) => {
        await buscarVendedorOuFalhar(req.params.id);
        await FuncionarioModel.atualizarFuncionario(req.params.id, { status_ativo: false });
        res.json({ sucesso: true, mensagem: 'Vendedor desativado com sucesso!' });
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
