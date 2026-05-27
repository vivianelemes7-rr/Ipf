const db = require('../config/database');
const AppError = require('../utils/AppError');
const FuncionarioModel = require('../models/funcionarioModel');
const PedidoModel = require('../models/pedidoModel');
const ProducaoModel = require('../models/producaoModel');

const ETAPAS_PRODUCAO = [
    'Aguardando Liberacao',
    'Aguardando Matriz',
    'Fila de Corte',
    'Fabricacao',
    'Acabamento',
    'Expedicao',
    'Finalizado'
];

const ALIASES_ETAPAS = {
    'Aguardando Liberação': 'Aguardando Liberacao',
    'Fabricação': 'Fabricacao',
    'Expedição': 'Expedicao'
};

const STATUS_PEDIDO = {
    PRODUCAO: 'Producao',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado'
};

function normalizarEtapa(etapa) {
    const valor = String(etapa || '').trim();
    return ALIASES_ETAPAS[valor] || valor;
}

function validarEtapa(etapa) {
    const etapaNormalizada = normalizarEtapa(etapa);
    if (!ETAPAS_PRODUCAO.includes(etapaNormalizada)) {
        throw AppError.badRequest(`Etapa de produção inválida: ${etapa || ''}.`);
    }
    return etapaNormalizada;
}

function podeForcarTransicao(usuario = {}) {
    const cargo = String(usuario.cargo || '').trim().toLowerCase();
    const permissoes = usuario.permissoes || {};
    return cargo === 'administrador'
        || permissoes.pode_retroceder_card === true
        || permissoes.pode_retroceder_card === 1
        || permissoes.pode_mover_qualquer_etapa === true
        || permissoes.pode_mover_qualquer_etapa === 1
        || permissoes.pode_forcar_transicao === true
        || permissoes.pode_forcar_transicao === 1;
}

function validarTransicao(etapaAtual, novaEtapa, usuario) {
    if (etapaAtual === novaEtapa) return;
    if (podeForcarTransicao(usuario)) return;

    const indiceAtual = ETAPAS_PRODUCAO.indexOf(etapaAtual);
    const indiceNovo = ETAPAS_PRODUCAO.indexOf(novaEtapa);

    if (indiceAtual === -1 || indiceNovo === -1 || indiceNovo !== indiceAtual + 1) {
        throw AppError.badRequest('Movimentação inválida para o fluxo de produção.');
    }
}

function tipoProducaoPedido(pedido) {
    return pedido.tipo_pedido === 'Especial' ? 'Especial' : 'Normal';
}

function etapaInicialProducao(pedido, arquitetura) {
    if (pedido.tipo_pedido === 'Especial' && !arquitetura?.matriz_recebida_check) {
        return 'Aguardando Matriz';
    }
    return 'Fila de Corte';
}

async function notificarEntrada(card) {
    if (!card) return;
    const NotificacaoProducaoService = require('./notificacoes_producaoService');
    const destinatarios = card.responsavel_producao_id
        ? [{ id: card.responsavel_producao_id }]
        : await FuncionarioModel.listarPorCargo('Producao');

    for (const funcionario of destinatarios) {
        await NotificacaoProducaoService.gerarAlerta({
            funcionario_id: funcionario.id,
            titulo: 'Pedido entrou na produção',
            mensagem: `Pedido ${card.numero_pedido || card.pedido_id} está em ${card.etapa_kanban}.`,
            pedido_id: card.pedido_id,
            prioridade_alerta: 'Normal'
        });
    }
}

async function notificarExpedicao(card) {
    if (!card) return;
    const NotificacaoProducaoService = require('./notificacoes_producaoService');
    const destinatarios = card.responsavel_producao_id
        ? [{ id: card.responsavel_producao_id }]
        : await FuncionarioModel.listarPorCargo('Producao');

    for (const funcionario of destinatarios) {
        await NotificacaoProducaoService.gerarAlerta({
            funcionario_id: funcionario.id,
            titulo: 'Pedido chegou em expedição',
            mensagem: `Pedido ${card.numero_pedido || card.pedido_id} chegou em Expedicao.`,
            pedido_id: card.pedido_id,
            prioridade_alerta: 'Normal'
        });
    }
}

async function notificarFinanceiroFinalizacao(card) {
    if (!card?.responsavel_fin_id) return;
    const NotificacaoFinService = require('./notificacoes_finService');
    await NotificacaoFinService.gerarAlerta({
        funcionario_id: card.responsavel_fin_id,
        titulo: 'Produção finalizada',
        mensagem: `Pedido ${card.numero_pedido || card.pedido_id} foi finalizado na produção. Emitir etapa fiscal.`,
        pedido_id: card.pedido_id,
        tipo_alerta: 'Fiscal',
        prioridade_alerta: 'Urgente'
    });
}


const ProducaoService = {
    ETAPAS_PRODUCAO,

    listarFilaCompleta: async (filtros = {}) => {
        const filtrosNormalizados = { ...filtros };
        if (filtrosNormalizados.etapa_kanban) {
            filtrosNormalizados.etapa_kanban = validarEtapa(filtrosNormalizados.etapa_kanban);
        }
        return await ProducaoModel.listarFilaCompleta(filtrosNormalizados);
    },

    buscarCard: async (id) => {
        if (!id) throw AppError.badRequest('ID da produção é obrigatório.');
        const card = await ProducaoModel.buscarPorId(id);
        if (!card) throw AppError.notFound('Card de produção não encontrado.');
        return card;
    },

    moverParaProducao: async (pedidoId, dados = {}) => {
        if (!pedidoId) throw AppError.badRequest('pedido_id é obrigatório.');

        const pedido = await PedidoModel.buscarPedidoPorId(pedidoId);
        if (!pedido) throw AppError.notFound('Pedido não encontrado.');
        if (pedido.status_pedido === STATUS_PEDIDO.CANCELADO) {
            throw AppError.badRequest('Pedido cancelado não pode entrar na produção.');
        }

        const existente = await ProducaoModel.buscarPorPedidoId(pedidoId);
        if (existente) {
            return { sucesso: true, criado: false, data: existente };
        }

        const financeiro = await PedidoModel.buscarFinanceiroPorPedidoId(pedidoId);
        if (!financeiro || !(financeiro.liberado_para_producao === 1 || financeiro.liberado_para_producao === true)) {
            throw AppError.badRequest('Pedido ainda não liberado pelo financeiro.');
        }

        const arquitetura = await PedidoModel.buscarArquiteturaPorPedidoId(pedidoId);
        if (pedido.tipo_pedido === 'Especial' && !arquitetura?.matriz_recebida_check) {
            throw AppError.badRequest('Pedido especial só entra na produção após confirmação da matriz pela arquitetura.');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const etapa_kanban = dados.etapa_kanban
                ? validarEtapa(dados.etapa_kanban)
                : etapaInicialProducao(pedido, arquitetura);

            const criado = await ProducaoModel.criarCardProducao({
                pedido_id: pedidoId,
                arquitetura_id: arquitetura?.id || dados.arquitetura_id || null,
                financeiro_id: financeiro.id,
                etapa_kanban,
                tipo_producao: tipoProducaoPedido(pedido),
                matriz_pronta_interna: dados.matriz_pronta_interna || false,
                matriz_chegou_externa: dados.matriz_chegou_externa || Boolean(arquitetura?.matriz_recebida_check),
                responsavel_producao_id: dados.responsavel_producao_id || null,
                data_inicio_real: dados.data_inicio_real || new Date(),
                previsao_entrega_final: dados.previsao_entrega_final || null
            }, connection);

            await PedidoModel.atualizarStatus(pedidoId, STATUS_PEDIDO.PRODUCAO, connection);
            await connection.commit();

            const card = await ProducaoModel.buscarPorId(criado.insertId);
            await notificarEntrada(card);
            return { sucesso: true, criado: true, data: card };
        } catch (erro) {
            await connection.rollback();
            throw erro;
        } finally {
            connection.release();
        }
    },

    atualizarEtapa: async (id, etapa, usuario = {}) => {
        const novaEtapa = validarEtapa(etapa);
        const cardAtual = await ProducaoService.buscarCard(id);
        validarTransicao(cardAtual.etapa_kanban, novaEtapa, usuario);

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await ProducaoModel.atualizarEtapa(id, novaEtapa, connection);

            if (novaEtapa === 'Finalizado') {
                await PedidoModel.atualizarStatus(cardAtual.pedido_id, STATUS_PEDIDO.FINALIZADO, connection);
            } else {
                await PedidoModel.atualizarStatus(cardAtual.pedido_id, STATUS_PEDIDO.PRODUCAO, connection);
            }

            await connection.commit();
        } catch (erro) {
            await connection.rollback();
            throw erro;
        } finally {
            connection.release();
        }

        const card = await ProducaoService.buscarCard(id);
        if (novaEtapa === 'Expedicao') await notificarExpedicao(card);
        if (novaEtapa === 'Finalizado') {
            await notificarFinanceiroFinalizacao(card);
        }
        return card;
    },

    atualizarResponsavel: async (id, responsavelId) => {
        await ProducaoService.buscarCard(id);
        const afetados = await ProducaoModel.atualizarResponsavel(id, responsavelId);
        if (afetados === 0) throw AppError.notFound('Card de produção não encontrado.');
        return await ProducaoService.buscarCard(id);
    },

    atualizarMatriz: async (id, dadosMatriz) => {
        const cardAtual = await ProducaoService.buscarCard(id);
        const dados = { ...dadosMatriz };
        if (dados.tipo_producao) {
            dados.tipo_producao = dados.tipo_producao === 'Especial (Matriz)' ? 'Especial' : dados.tipo_producao;
            if (!['Normal', 'Especial'].includes(dados.tipo_producao)) {
                throw AppError.badRequest('tipo_producao deve ser Normal ou Especial.');
            }
        }

        const afetados = await ProducaoModel.atualizarMatriz(id, dados);
        if (afetados === 0) throw AppError.badRequest('Nenhum campo de matriz válido para atualizar.');

        const deveLiberarMatriz = cardAtual.etapa_kanban === 'Aguardando Matriz'
            && (dados.matriz_chegou_externa === true || dados.matriz_chegou_externa === 1 || dados.matriz_pronta_interna === true || dados.matriz_pronta_interna === 1);

        if (deveLiberarMatriz) {
            await ProducaoModel.atualizarEtapa(id, 'Fila de Corte');
        }

        return await ProducaoService.buscarCard(id);
    },

    atualizarDatas: async (id, dadosDatas) => {
        await ProducaoService.buscarCard(id);
        const afetados = await ProducaoModel.atualizarDatas(id, dadosDatas || {});
        if (afetados === 0) throw AppError.badRequest('Nenhum campo de data válido para atualizar.');
        return await ProducaoService.buscarCard(id);
    },

    removerCard: async (id) => {
        const card = await ProducaoService.buscarCard(id);
        const afetados = await ProducaoModel.deletar(id);
        if (afetados === 0) throw AppError.notFound('Card de produção não encontrado.');
        return { sucesso: true, removido: true, pedido_id: card.pedido_id };
    }
};

module.exports = ProducaoService;

