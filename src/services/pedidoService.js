const db = require('../config/database');
const AppError = require('../utils/AppError');
const ClienteModel = require('../models/clienteModel');
const PedidoModel = require('../models/pedidoModel');

const TIPOS_PEDIDO = ['Normal', 'Especial'];
const STATUS_PEDIDO = {
    PROCESSAMENTO: 'Em Processamento',
    ARQUITETURA: 'Arquitetura',
    PRODUCAO: 'Producao',
    FINALIZADO: 'Finalizado',
    CANCELADO: 'Cancelado'
};

class PedidoService {
    static validarTipoPedido(tipoPedido) {
        if (!TIPOS_PEDIDO.includes(tipoPedido)) {
            throw AppError.badRequest('tipo_pedido deve ser Normal ou Especial.');
        }
    }

    static definirProximaFase(pedido) {
        PedidoService.validarTipoPedido(pedido.tipo_pedido);
        return pedido.tipo_pedido === 'Especial' ? STATUS_PEDIDO.ARQUITETURA : STATUS_PEDIDO.PRODUCAO;
    }

    static validarDadosPedido(dados, parcial = false) {
        if (!parcial && !dados.lead_id) {
            throw AppError.badRequest('lead_id é obrigatório.');
        }

        if (!parcial && !dados.numero_pedido) {
            throw AppError.badRequest('numero_pedido é obrigatório.');
        }

        if (dados.tipo_pedido) {
            PedidoService.validarTipoPedido(dados.tipo_pedido);
        } else if (!parcial) {
            throw AppError.badRequest('tipo_pedido é obrigatório.');
        }

        if (dados.valor_total_fechado !== undefined && Number(dados.valor_total_fechado) < 0) {
            throw AppError.badRequest('valor_total_fechado não pode ser negativo.');
        }

        if (dados.prazo_entrega_acordado !== undefined && dados.prazo_entrega_acordado !== null && Number(dados.prazo_entrega_acordado) < 0) {
            throw AppError.badRequest('prazo_entrega_acordado não pode ser negativo.');
        }
    }

    static async listarPedidos(filtros = {}) {
        return await PedidoModel.listarPedidos(filtros);
    }

    static async buscarPedido(id) {
        const pedido = await PedidoModel.buscarPedidoCompletoPorId(id);
        if (!pedido) {
            throw AppError.notFound('Pedido não encontrado.');
        }
        return pedido;
    }

    static async criarPedido(dados) {
        PedidoService.validarDadosPedido(dados);

        const lead = await ClienteModel.buscarLeadPorId(dados.lead_id);
        if (!lead) {
            throw AppError.notFound('Lead/cliente não encontrado.');
        }

        const pedidoExistente = await PedidoModel.buscarPedidoPorNumero(dados.numero_pedido);
        if (pedidoExistente) {
            throw AppError.conflict('Número de pedido já cadastrado.');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const pedidoCriado = await PedidoModel.criarPedido(dados, connection);
            await connection.query(
                "UPDATE leads SET convertido = TRUE, status_lead = 'Qualificado' WHERE id = ?",
                [dados.lead_id]
            );
            const financeiroCriado = await PedidoModel.criarCardFinanceiroParaPedido({
                pedido_id: pedidoCriado.insertId,
                valor_total_pedido: dados.valor_total_fechado || 0
            }, connection);
            await connection.commit();

            return {
                pedido_id: pedidoCriado.insertId,
                financeiro_id: financeiroCriado.insertId
            };
        } catch (erro) {
            await connection.rollback();
            throw erro;
        } finally {
            connection.release();
        }
    }

    static async atualizarPedido(id, dados) {
        const pedido = await PedidoModel.buscarPedidoPorId(id);
        if (!pedido) {
            throw AppError.notFound('Pedido não encontrado.');
        }
        if (pedido.status_pedido === STATUS_PEDIDO.CANCELADO || pedido.status_pedido === STATUS_PEDIDO.FINALIZADO) {
            throw AppError.badRequest('Pedido cancelado ou finalizado não pode ser atualizado.');
        }

        PedidoService.validarDadosPedido(dados, true);
        await PedidoModel.atualizarPedido(id, dados);
        return await PedidoService.buscarPedido(id);
    }

    static async avancarPedido(id) {
        const pedido = await PedidoModel.buscarPedidoPorId(id);
        if (!pedido) {
            throw AppError.notFound('Pedido não encontrado.');
        }
        if (pedido.status_pedido === STATUS_PEDIDO.CANCELADO) {
            throw AppError.badRequest('Pedido cancelado não pode avançar.');
        }
        if (pedido.status_pedido === STATUS_PEDIDO.FINALIZADO) {
            throw AppError.badRequest('Pedido finalizado não pode avançar.');
        }

        const financeiro = await PedidoModel.buscarFinanceiroPorPedidoId(id);
        if (!financeiro || !(financeiro.liberado_para_producao === 1 || financeiro.liberado_para_producao === true)) {
            throw AppError.badRequest('Pedido ainda não liberado pelo financeiro.');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const proximaFase = PedidoService.definirProximaFase(pedido);

            if (proximaFase === STATUS_PEDIDO.PRODUCAO) {
                const producao = await PedidoModel.buscarProducaoPorPedidoId(id);
                if (!producao) {
                    await PedidoModel.criarCardProducaoParaPedido({
                        pedido_id: id,
                        financeiro_id: financeiro.id,
                        tipo_producao: 'Normal'
                    }, connection);
                }
                await PedidoModel.atualizarStatus(id, STATUS_PEDIDO.PRODUCAO, connection);
            }

            if (proximaFase === STATUS_PEDIDO.ARQUITETURA) {
                const arquitetura = await PedidoModel.buscarArquiteturaPorPedidoId(id);
                if (!arquitetura) {
                    await PedidoModel.criarCardArquiteturaParaPedido({ pedido_id: id }, connection);
                }
                await PedidoModel.atualizarStatus(id, STATUS_PEDIDO.ARQUITETURA, connection);
            }

            await connection.commit();
            return await PedidoService.buscarPedido(id);
        } catch (erro) {
            await connection.rollback();
            throw erro;
        } finally {
            connection.release();
        }
    }

    static async cancelarPedido(id) {
        const pedido = await PedidoModel.buscarPedidoPorId(id);
        if (!pedido) {
            throw AppError.notFound('Pedido não encontrado.');
        }
        if (pedido.status_pedido === STATUS_PEDIDO.FINALIZADO) {
            throw AppError.badRequest('Pedido finalizado não pode ser cancelado.');
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            await PedidoModel.atualizarStatus(id, STATUS_PEDIDO.CANCELADO, connection);
            await PedidoModel.marcarCardsCancelados(id, connection);
            await connection.commit();
            return await PedidoService.buscarPedido(id);
        } catch (erro) {
            await connection.rollback();
            throw erro;
        } finally {
            connection.release();
        }
    }

    static async finalizarPedido(id) {
        const pedido = await PedidoModel.buscarPedidoPorId(id);
        if (!pedido) {
            throw AppError.notFound('Pedido não encontrado.');
        }

        const producao = await PedidoModel.buscarProducaoPorPedidoId(id);
        if (!producao) {
            throw AppError.badRequest('Pedido não possui card de produção.');
        }
        if (producao.etapa_kanban !== 'Expedicao') {
            throw AppError.badRequest('Pedido só pode ser finalizado quando produção estiver em Expedicao.');
        }

        await PedidoModel.atualizarStatus(id, STATUS_PEDIDO.FINALIZADO);
        return await PedidoService.buscarPedido(id);
    }
}

module.exports = PedidoService;
