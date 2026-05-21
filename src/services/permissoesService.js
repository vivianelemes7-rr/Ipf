const PermissoesService = {
    gerarPermissoesPorCargo(cargo) {
        let cargoNormalizado = String(cargo || '').trim().toLowerCase();
        if (cargoNormalizado === 'administrador') cargoNormalizado = 'gerente';

        const permissoesBase = {
            modulo_vendas: false,
            modulo_financeiro: false,
            modulo_producao: false,
            modulo_arquitetura: false,
            pode_editar: true,
            pode_deletar: false,
            ver_apenas_proprio: true,
            pode_retroceder_card: false,
            pode_mover_qualquer_etapa: false,
            pode_reabrir_card: false,
            pode_aprovar_entrega_etapa: false,
            pode_forcar_transicao: false,
            pode_trocar_responsavel: false,
            pode_assumir_card: true,
            pode_alterar_prazos: true,
            pode_alterar_prioridade: false,
            pode_ver_valores: true,
            pode_arquivar_card: false,
            pode_deletar_comentarios: false,
            pode_editar_comentarios_outros: false,
            pode_marcar_impedimento: true,
            pode_destravar_impedimento: false
        };

        if (cargoNormalizado === 'vendedor') {
            permissoesBase.modulo_vendas = true;
        } else if (cargoNormalizado === 'financeiro') {
            permissoesBase.modulo_financeiro = true;
        } else if (cargoNormalizado === 'producao' || cargoNormalizado === 'produção') {
            permissoesBase.modulo_producao = true;
            permissoesBase.pode_retroceder_card = false;
            permissoesBase.pode_mover_qualquer_etapa = false;
            permissoesBase.pode_trocar_responsavel = true;
            permissoesBase.pode_destravar_impedimento = true;
        } else if (cargoNormalizado === 'arquitetura') {
            permissoesBase.modulo_arquitetura = true;
            permissoesBase.pode_retroceder_card = true;
            permissoesBase.pode_mover_qualquer_etapa = true;
            permissoesBase.pode_reabrir_card = true;
            permissoesBase.pode_aprovar_entrega_etapa = true;
            permissoesBase.pode_trocar_responsavel = true;
        } else if (cargoNormalizado === 'gerente') {
            permissoesBase.modulo_vendas = true;
            permissoesBase.modulo_financeiro = true;
            permissoesBase.modulo_producao = true;
            permissoesBase.modulo_arquitetura = true;
            permissoesBase.pode_deletar = true;
            permissoesBase.ver_apenas_proprio = false;
            permissoesBase.pode_retroceder_card = true;
            permissoesBase.pode_mover_qualquer_etapa = true;
            permissoesBase.pode_reabrir_card = true;
            permissoesBase.pode_aprovar_entrega_etapa = true;
            permissoesBase.pode_forcar_transicao = true;
            permissoesBase.pode_trocar_responsavel = true;
            permissoesBase.pode_alterar_prioridade = true;
            permissoesBase.pode_arquivar_card = true;
            permissoesBase.pode_deletar_comentarios = true;
            permissoesBase.pode_editar_comentarios_outros = true;
            permissoesBase.pode_destravar_impedimento = true;
        }

        return permissoesBase;
    },

    validarPermissoes(dados) {
        const erros = [];
        const camposPermitidos = [
            'modulo_vendas', 'modulo_financeiro', 'modulo_producao', 'modulo_arquitetura',
            'pode_editar', 'pode_deletar', 'ver_apenas_proprio',
            'pode_retroceder_card', 'pode_mover_qualquer_etapa', 'pode_reabrir_card',
            'pode_aprovar_entrega_etapa', 'pode_forcar_transicao',
            'pode_trocar_responsavel', 'pode_assumir_card',
            'pode_alterar_prazos', 'pode_alterar_prioridade',
            'pode_ver_valores', 'pode_arquivar_card',
            'pode_deletar_comentarios', 'pode_editar_comentarios_outros',
            'pode_marcar_impedimento', 'pode_destravar_impedimento'
        ];

        Object.keys(dados).forEach(campo => {
            if (!camposPermitidos.includes(campo)) {
                erros.push(`Campo inválido: ${campo}`);
            } else if (typeof dados[campo] !== 'boolean' && dados[campo] !== 0 && dados[campo] !== 1) {
                erros.push(`${campo} deve ser booleano ou 0/1`);
            }
        });

        return erros;
    }
};

module.exports = PermissoesService;
