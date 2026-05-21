const AutenticacaoModel = require('../models/autenticacaoModel');
const FuncionarioModel = require('../models/funcionarioModel');
const PermissoesModel = require('../models/permissoesModel');
const AutenticacaoService = require('../services/autenticacaoService');
const PermissoesService = require('../services/permissoesService');
const AppError = require('../utils/AppError');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const AutenticacaoController = {
    cadastrar: asyncHandler(async (req, res) => {
        const { nome, email } = req.body;
        const senha = req.body.password || req.body.senha;

        logger.info('CADASTRO', `Registrando: ${email}`);
        const senhaHash = await AutenticacaoService.criptografarSenha(senha);
        await FuncionarioModel.criar({
            nome,
            email,
            senha: senhaHash,
            cargo: null,
            departamento: null,
            status_ativo: false
        });

        logger.info('CADASTRO', `Usuário registrado: ${email}`);
        res.status(201).json({ mensagem: 'Usuário registrado com sucesso!' });
    }),

    login: asyncHandler(async (req, res) => {
        const { email, cargo: cargoReq, role: roleReq } = req.body;
        const senhaFinal = req.body.password || req.body.senha;

        logger.info('LOGIN', `Tentativa: ${email}`);
        const user = await AutenticacaoModel.buscarPorEmailParaLogin(email);

        if (!user || !(await AutenticacaoService.compararSenha(senhaFinal, user.senha))) {
            throw AppError.unauthorized('E-mail ou senha incorretos.');
        }

        if (!user.status_ativo) {
            throw AppError.forbidden('Cadastro pendente. Aguarde aprovação do gerente.');
        }

        const requestedCargo = cargoReq || roleReq;
        if (requestedCargo) {
            const cargoNormalizadoSolicitado = AutenticacaoService.normalizarCargo(requestedCargo);
            if (!AutenticacaoService.isCargoValido(cargoNormalizadoSolicitado)) {
                throw AppError.badRequest(
                    'Cargo inválido no login. Valores válidos: vendedor, financeiro, produção, arquitetura, gerente.'
                );
            }

            if (/administrador/i.test(requestedCargo) && AutenticacaoService.normalizarCargo(user.cargo) !== 'gerente') {
                throw AppError.forbidden('Acesso negado para cargo inexistente ou não autorizado.');
            }
        }

        const token = AutenticacaoService.gerarToken(user);
        const cargoFormatado = AutenticacaoService.formatarCargo(user.cargo);
        const role = AutenticacaoService.normalizarCargo(user.cargo);

        logger.info('LOGIN', `Sucesso: ${email}`);
        res.json({
            token,
            cargo: cargoFormatado,
            role,
            nome: user.nome,
            email: user.email,
            user: {
                id: user.id,
                name: user.nome,
                email: user.email,
                role
            }
        });
    }),

    esquecerSenha: asyncHandler(async (req, res) => {
        const { email } = req.body;
        await AutenticacaoModel.buscarPorEmailParaLogin(email);
        res.json({
            mensagem: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.'
        });
    }),

    cadastrarAdmin: asyncHandler(async (req, res) => {
        const { nome, email } = req.body;
        const senha = req.body.password || req.body.senha;

        logger.info('CADASTRO_ADMIN', `Criando gerente: ${email}`);
        const senhaHash = await AutenticacaoService.criptografarSenha(senha);
        const funcionarioId = await FuncionarioModel.criar({
            nome,
            email,
            senha: senhaHash,
            cargo: 'Gerente',
            departamento: 'Diretoria',
            status_ativo: true
        });

        await PermissoesModel.criar(
            funcionarioId,
            PermissoesService.gerarPermissoesPorCargo('gerente')
        );

        logger.info('CADASTRO_ADMIN', `Gerente criado: ${email}`);
        res.status(201).json({ mensagem: 'Gerente criado com sucesso!' });
    }),

    alterarSenha: asyncHandler(async (req, res) => {
        const userId = req.usuario.id;
        const { senhaAtual, senhaNova } = req.body;

        const user = await AutenticacaoModel.buscarPorId(userId);
        if (!user) {
            throw AppError.notFound('Usuário não encontrado.');
        }

        const senhaValida = await AutenticacaoService.compararSenha(senhaAtual, user.senha);
        if (!senhaValida) {
            throw AppError.unauthorized('Senha atual incorreta.');
        }

        const novaSenhaHash = await AutenticacaoService.criptografarSenha(senhaNova);
        await AutenticacaoModel.atualizarSenha(userId, novaSenhaHash);

        logger.info('ALTERAR_SENHA', `Senha alterada: usuário ${userId}`);
        res.json({ mensagem: 'Senha alterada com sucesso!' });
    })
};

module.exports = AutenticacaoController;
