const FuncionarioModel = require('../models/funcionarioModel');
const AutenticacaoService = require('../services/autenticacaoService');

const FuncionarioController = {
    async listar(req, res, next) {
        try {
            const lista = await FuncionarioModel.listarTodos();
            res.json(lista);
        } catch (e) { next(e); }
    },

    async editar(req, res, next) {
        try {
            const { permissoes, senha, ...dados } = req.body;
            if (senha) dados.senha = await AutenticacaoService.criptografarSenha(senha);
            await FuncionarioModel.atualizarFuncionario(req.params.id, dados);
            if (permissoes) await FuncionarioModel.atualizarPermissoes(req.params.id, permissoes);
            res.json({ mensagem: "Dados atualizados!" });
        } catch (e) { next(e); }
    },

    async excluir(req, res, next) {
        try {
            const ok = await FuncionarioModel.deletar(req.params.id);
            if (!ok) { const e = new Error("Funcionário não encontrado"); e.statusCode = 404; throw e; }
            res.json({ mensagem: "Removido com sucesso!" });
        } catch (e) { next(e); }
    }
};

module.exports = FuncionarioController;