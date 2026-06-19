const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const FuncionarioModel = require('../models/funcionarioModel');

function extrairToken(auth) {
    if (!auth || typeof auth !== 'string') return null;

    const partes = auth.trim().split(' ');
    if (partes.length === 2 && partes[0] === 'Bearer') {
        return partes[1];
    }
    if (partes.length === 1) {
        return partes[0];
    }
    return null;
}

function permissaoAtiva(valor) {
    return valor === 1 || valor === true;
}

function normalizarCargo(cargo) {
    const normalizado = String(cargo || '').trim().toLowerCase();
    return normalizado === 'produção' ? 'producao' : normalizado;
}

function isAdministrador(cargo) {
    return normalizarCargo(cargo) === 'administrador';
}

function autenticarRequisicao(req) {
    const auth = req.headers.authorization;
    if (!auth) {
        throw AppError.unauthorized('Token não fornecido');
    }

    const token = extrairToken(auth);
    if (!token) {
        throw AppError.unauthorized('Formato de token inválido. Use: Bearer <token>');
    }

    return jwt.verify(token, process.env.JWT_SECRET);
}

const verificarToken = (req, res, next) => {
    try {
        req.usuario = autenticarRequisicao(req);
        next();
    } catch (erro) {
        next(erro);
    }
};

const verificarCadastroAdmin = async (req, res, next) => {
    try {
        const existeAdministrador = await FuncionarioModel.existeAdministradorAtivo();
        if (!existeAdministrador) {
            return next();
        }

        req.usuario = req.usuario || autenticarRequisicao(req);
        if (!isAdministrador(req.usuario.cargo)) {
            throw AppError.forbidden('Apenas administradores podem criar outro administrador');
        }

        next();
    } catch (erro) {
        next(erro);
    }
};

const verificarModulo = (modulo) => {
    return (req, res, next) => {
        try {
            req.usuario = req.usuario || autenticarRequisicao(req);
            if (isAdministrador(req.usuario.cargo)) {
                return next();
            }
            if (!permissaoAtiva(req.usuario?.permissoes?.[modulo])) {
                throw AppError.forbidden('Acesso negado');
            }
            next();
        } catch (erro) {
            next(erro);
        }
    };
};

const verificarQualquerModulo = (modulos = []) => {
    return (req, res, next) => {
        try {
            req.usuario = req.usuario || autenticarRequisicao(req);
            if (isAdministrador(req.usuario.cargo)) {
                return next();
            }
            const possuiModulo = modulos.some((modulo) => permissaoAtiva(req.usuario?.permissoes?.[modulo]));
            if (!possuiModulo) {
                throw AppError.forbidden('Acesso negado');
            }
            next();
        } catch (erro) {
            next(erro);
        }
    };
};

const verificarModuloVendas = verificarModulo('modulo_vendas');
const verificarModuloFinanceiro = verificarModulo('modulo_financeiro');
const verificarModuloProducao = verificarModulo('modulo_producao');
const verificarModuloArquitetura = verificarModulo('modulo_arquitetura');

const verificarAcesso = (cargos = [], modulo = null) => {
    return (req, res, next) => {
        try {
            req.usuario = req.usuario || autenticarRequisicao(req);
            const cargoUsuario = normalizarCargo(req.usuario.cargo);
            const cargosPermitidos = cargos.map(c => normalizarCargo(c));
            const usuarioAdministrador = isAdministrador(cargoUsuario);
            const cargoOk = cargos.length === 0
                || cargosPermitidos.includes(cargoUsuario)
                || usuarioAdministrador;

            let moduloOk = true;
            if (modulo && !usuarioAdministrador) {
                moduloOk = permissaoAtiva(req.usuario.permissoes?.[modulo]);
            }

            if (!cargoOk || !moduloOk) {
                throw AppError.forbidden('Acesso negado');
            }
            next();
        } catch (erro) {
            next(erro);
        }
    };
};

const checkPermission = (perm) => {
    return (req, res, next) => {
        try {
            req.usuario = req.usuario || autenticarRequisicao(req);
            if (isAdministrador(req.usuario.cargo)) {
                return next();
            }

            const permissoes = req.usuario?.permissoes;
            if (!permissoes) {
                throw AppError.unauthorized('Token inválido ou não autenticado');
            }

            if (!permissaoAtiva(permissoes[perm])) {
                throw AppError.forbidden('Permissão negada');
            }

            next();
        } catch (erro) {
            next(erro);
        }
    };
};

module.exports = {
    verificarToken,
    verificarCadastroAdmin,
    verificarModuloVendas,
    verificarModuloFinanceiro,
    verificarModuloProducao,
    verificarModuloArquitetura,
    verificarQualquerModulo,
    verificarAcesso,
    checkPermission
};
