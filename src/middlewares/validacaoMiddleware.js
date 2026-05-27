const AppError = require('../utils/AppError');

const CARGOS_VALIDOS = ['Vendedor', 'Financeiro', 'Produção', 'Arquitetura', 'Gerente', 'Administrador', 'Producao'];
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function falharValidacao(erros) {
    return AppError.unprocessable('Dados inválidos', erros);
}

function validarSenha(senha, erros, { obrigatoria = true, minimo = 6 } = {}) {
    if (!senha) {
        if (obrigatoria) erros.push('Senha é obrigatória');
        return;
    }
    if (senha.length < minimo) erros.push(`Senha deve ter no mínimo ${minimo} caracteres`);
    if (senha.length > 128) erros.push('Senha muito longa (máximo 128 caracteres)');
}

function validarEmailCampo(email, erros, obrigatorio = true) {
    if (!email || (typeof email === 'string' && email.trim().length === 0)) {
        if (obrigatorio) erros.push('E-mail é obrigatório');
        return;
    }
    if (!REGEX_EMAIL.test(String(email).trim())) {
        erros.push('Formato de e-mail inválido');
    }
}

function validarCargo(cargo, erros, obrigatorio = true) {
    if (!cargo || cargo.trim().length === 0) {
        if (obrigatorio) erros.push('Cargo é obrigatório');
        return;
    }
    if (!CARGOS_VALIDOS.some(v => v.toLowerCase() === cargo.trim().toLowerCase())) {
        erros.push(`Cargo inválido. Valores válidos: ${CARGOS_VALIDOS.join(', ')}`);
    }
}

const validarCadastroPublico = (req, res, next) => {
    const { nome, email, senha, password } = req.body;
    const erros = [];

    if (!nome || nome.trim().length === 0) erros.push('Nome é obrigatório');
    if (nome && nome.length > 255) erros.push('Nome muito longo (máximo 255 caracteres)');
    validarEmailCampo(email, erros);
    validarSenha(password || senha, erros);

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarCadastroAdmin = (req, res, next) => {
    const { nome, email, senha, password } = req.body;
    const erros = [];

    if (!nome || nome.trim().length === 0) erros.push('Nome é obrigatório');
    validarEmailCampo(email, erros);
    validarSenha(password || senha, erros);

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarCadastroFuncionario = (req, res, next) => {
    const { nome, email, cargo, departamento, senha, password } = req.body;
    const erros = [];

    if (!nome || nome.trim().length === 0) erros.push('Nome é obrigatório');
    validarEmailCampo(email, erros);
    validarCargo(cargo, erros);
    if (!departamento || departamento.trim().length === 0) erros.push('Departamento é obrigatório');
    validarSenha(password || senha, erros);

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarCadastroVendedor = (req, res, next) => {
    const { nome, email, senha, password } = req.body;
    const erros = [];

    if (!nome || nome.trim().length === 0) erros.push('Nome é obrigatório');
    validarEmailCampo(email, erros);
    validarSenha(password || senha, erros);

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarLogin = (req, res, next) => {
    const { email, senha, password } = req.body;
    const erros = [];

    validarEmailCampo(email, erros);
    validarSenha(password || senha, erros);

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarEmailObrigatorio = (req, res, next) => {
    const erros = [];
    validarEmailCampo(req.body.email, erros);
    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarAlterarSenha = (req, res, next) => {
    const { senhaAtual, senhaNova, confirmarSenha } = req.body;
    const erros = [];

    if (!senhaAtual) erros.push('Senha atual é obrigatória');
    if (!senhaNova) erros.push('Nova senha é obrigatória');
    if (!confirmarSenha) erros.push('Confirmação de senha é obrigatória');

    if (senhaNova && senhaNova !== confirmarSenha) {
        erros.push('As senhas não coincidem');
    }
    validarSenha(senhaNova, erros, { minimo: 8 });

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

const validarAtualizacaoFuncionario = (req, res, next) => {
    const { nome, email, cargo, senha, password } = req.body;
    const erros = [];

    if (nome !== undefined && (!nome || nome.trim().length === 0)) {
        erros.push('Nome não pode ser vazio');
    }
    if (email !== undefined) validarEmailCampo(email, erros);
    if (cargo !== undefined) validarCargo(cargo, erros);
    if (senha !== undefined || password !== undefined) {
        validarSenha(password || senha, erros);
    }

    if (erros.length > 0) return next(falharValidacao(erros));
    next();
};

module.exports = {
    CARGOS_VALIDOS,
    validarCadastroPublico,
    validarCadastroAdmin,
    validarCadastroFuncionario,
    validarCadastroVendedor,
    validarLogin,
    validarEmailObrigatorio,
    validarAlterarSenha,
    validarAtualizacaoFuncionario
};
