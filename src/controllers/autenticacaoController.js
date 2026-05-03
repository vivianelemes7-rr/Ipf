const AutenticacaoModel = require('../models/autenticacaoModel');
const FuncionarioModel = require('../models/funcionarioModel');
const AutenticacaoService = require('../services/autenticacaoService');

const AutenticacaoController = {
    async cadastrar(req, res, next) {
        try {
            const { nome, email, senha, cargo, departamento, permissoes } = req.body;
            const senhaHash = await AutenticacaoService.criptografarSenha(senha);
            await FuncionarioModel.criar({ nome, email, senha: senhaHash, cargo, departamento, status_ativo: 1 }, permissoes || {});
            res.status(201).json({ mensagem: "Usuário registrado com sucesso!" });
        } catch (erro) { next(erro); }
    },

    async login(req, res, next) {
        try {
            const { email, senha } = req.body;
            const user = await AutenticacaoModel.buscarPorEmailParaLogin(email);
            if (!user || !(await AutenticacaoService.compararSenha(senha, user.senha))) {
                const e = new Error("E-mail ou senha incorretos."); e.statusCode = 401; throw e;
            }
            if (user.status_ativo === 0) {
                const e = new Error("Usuário inativo no sistema."); e.statusCode = 403; throw e;
            }
            const token = AutenticacaoService.gerarToken(user);
            res.json({ token, cargo: user.cargo, nome: user.nome });
        } catch (erro) { next(erro); }
    }
};

module.exports = AutenticacaoController;