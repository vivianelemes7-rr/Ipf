const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const PermissoesService = require('./permissoesService');

const AutenticacaoService = {
    validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof email === 'string' && regex.test(email.toLowerCase());
    },

    validarSenhaTamanho(senha) {
        if (!senha || typeof senha !== 'string') {
            throw AppError.badRequest('Senha inválida');
        }
        if (senha.length > 128) {
            throw AppError.badRequest('Senha muito longa (máximo 128 caracteres)');
        }
    },

    exigirJwtSecret() {
        if (!process.env.JWT_SECRET) {
            throw AppError.internal('JWT_SECRET não configurado no arquivo .env');
        }
    },

    async criptografarSenha(senha) {
        AutenticacaoService.validarSenhaTamanho(senha);
        return await bcrypt.hash(senha, 10);
    },

    async compararSenha(s1, s2) {
        return await bcrypt.compare(s1, s2);
    },

    normalizarCargo(cargo) {
        if (!cargo || typeof cargo !== 'string') return '';
        const normalized = cargo.trim().toLowerCase();
        if (normalized === 'administrador') return 'gerente';
        return normalized;
    },

    normalizarRole(cargo) {
        return AutenticacaoService.normalizarCargo(cargo);
    },

    isCargoValido(cargo) {
        const cargosValidos = ['vendedor', 'financeiro', 'producao', 'produção', 'arquitetura', 'gerente'];
        return cargosValidos.includes(AutenticacaoService.normalizarCargo(cargo));
    },

    formatarCargo(cargo) {
        const normalized = AutenticacaoService.normalizarCargo(cargo);
        const mapa = {
            vendedor: 'Vendedor',
            financeiro: 'Financeiro',
            producao: 'Produção',
            'produção': 'Produção',
            arquitetura: 'Arquitetura',
            gerente: 'Gerente'
        };
        return mapa[normalized] || cargo;
    },

    gerarToken(u) {
        AutenticacaoService.exigirJwtSecret();
        const cargoNormalizado = AutenticacaoService.normalizarCargo(u.cargo);
        const cargoFormatado = AutenticacaoService.formatarCargo(cargoNormalizado);

        const permissoes = cargoNormalizado === 'gerente'
            ? PermissoesService.gerarPermissoesPorCargo('gerente')
            : {
                modulo_vendas: u.modulo_vendas,
                modulo_financeiro: u.modulo_financeiro,
                modulo_producao: u.modulo_producao,
                modulo_arquitetura: u.modulo_arquitetura,
                pode_editar: u.pode_editar,
                pode_deletar: u.pode_deletar,
                ver_apenas_proprio: u.ver_apenas_proprio,
                pode_retroceder_card: u.pode_retroceder_card,
                pode_mover_qualquer_etapa: u.pode_mover_qualquer_etapa,
                pode_reabrir_card: u.pode_reabrir_card,
                pode_aprovar_entrega_etapa: u.pode_aprovar_entrega_etapa,
                pode_forcar_transicao: u.pode_forcar_transicao,
                pode_trocar_responsavel: u.pode_trocar_responsavel,
                pode_assumir_card: u.pode_assumir_card,
                pode_alterar_prazos: u.pode_alterar_prazos,
                pode_alterar_prioridade: u.pode_alterar_prioridade,
                pode_ver_valores: u.pode_ver_valores,
                pode_arquivar_card: u.pode_arquivar_card,
                pode_deletar_comentarios: u.pode_deletar_comentarios,
                pode_editar_comentarios_outros: u.pode_editar_comentarios_outros,
                pode_marcar_impedimento: u.pode_marcar_impedimento,
                pode_destravar_impedimento: u.pode_destravar_impedimento
            };

        return jwt.sign({
            id: u.id,
            email: u.email,
            cargo: cargoFormatado,
            permissoes
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
    }
};

module.exports = AutenticacaoService;
