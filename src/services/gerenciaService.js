const AppError = require('../utils/AppError');
const GerenciaModel = require('../models/gerenciaModel');
const KanbanGerenciaModel = require('../models/kanban_gerenciaModel');

const ETAPAS_KANBAN_GERENCIA = ['Pendente', 'Em Andamento', 'Revisao', 'Aprovado'];
const SETORES_KANBAN_GERENCIA = ['Vendas', 'Arquitetura', 'Financeiro', 'Producao', 'Gerencia'];
const TIPOS_CARD_GERENCIA = ['Resumo Setor', 'Decisao', 'Aprovacao', 'Prioridade', 'Tarefa Interna'];
const PRIORIDADES_GERENCIA = ['Baixa', 'Media', 'Alta', 'Urgente'];

function validarValorPermitido(valor, permitidos, campo) {
    if (!permitidos.includes(valor)) {
        throw AppError.badRequest(`${campo} inválido: ${valor || ''}.`);
    }
    return valor;
}

function normalizarJson(valor) {
    if (valor === undefined) return undefined;
    if (valor === null) return null;
    if (typeof valor === 'string') {
        const texto = valor.trim();
        if (!texto) return null;
        try {
            return JSON.stringify(JSON.parse(texto));
        } catch {
            return JSON.stringify([texto]);
        }
    }
    return JSON.stringify(valor);
}

function parseJson(valor) {
    if (!valor) return [];
    if (typeof valor === 'object') return valor;
    try {
        return JSON.parse(valor);
    } catch {
        return [];
    }
}

function formatarCard(card) {
    if (!card) return null;
    return {
        ...card,
        detalhes: parseJson(card.detalhes_json)
    };
}

function dadosAuditoria(usuario = {}) {
    return {
        atualizado_por_id: usuario.id || null,
        atualizado_por_perfil: usuario.cargo || usuario.role || null
    };
}

function montarDadosCard(dados = {}, usuario = {}, criacao = false) {
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(dados, 'etapa_kanban')) {
        payload.etapa_kanban = validarValorPermitido(dados.etapa_kanban, ETAPAS_KANBAN_GERENCIA, 'etapa_kanban');
    } else if (criacao) {
        payload.etapa_kanban = 'Pendente';
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'titulo')) {
        const titulo = String(dados.titulo || '').trim();
        if (!titulo) throw AppError.badRequest('titulo é obrigatório.');
        payload.titulo = titulo;
    } else if (criacao) {
        throw AppError.badRequest('titulo é obrigatório.');
    }

    const detalhes = Object.prototype.hasOwnProperty.call(dados, 'detalhes_json')
        ? dados.detalhes_json
        : dados.detalhes;
    const detalhesJson = normalizarJson(detalhes);
    if (detalhesJson !== undefined) payload.detalhes_json = detalhesJson;

    if (Object.prototype.hasOwnProperty.call(dados, 'observacoes_gerenciais')) {
        payload.observacoes_gerenciais = dados.observacoes_gerenciais || null;
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'setor_origem')) {
        payload.setor_origem = validarValorPermitido(dados.setor_origem, SETORES_KANBAN_GERENCIA, 'setor_origem');
    } else if (criacao) {
        payload.setor_origem = 'Gerencia';
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'tipo_card')) {
        payload.tipo_card = validarValorPermitido(dados.tipo_card, TIPOS_CARD_GERENCIA, 'tipo_card');
    } else if (criacao) {
        payload.tipo_card = 'Tarefa Interna';
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'prioridade')) {
        payload.prioridade = validarValorPermitido(dados.prioridade, PRIORIDADES_GERENCIA, 'prioridade');
    } else if (criacao) {
        payload.prioridade = 'Media';
    }

    if (Object.prototype.hasOwnProperty.call(dados, 'responsavel_gerencia_id')) {
        payload.responsavel_gerencia_id = dados.responsavel_gerencia_id || null;
    }

    payload.atualizado_por_id = usuario.id || null;
    payload.atualizado_por_perfil = usuario.cargo || usuario.role || null;

    if (criacao) {
        payload.criado_por_id = usuario.id || null;
        payload.criado_por_perfil = usuario.cargo || usuario.role || null;
    }

    return payload;
}

function numero(valor) {
    return Number(valor || 0);
}

function montarCardResumo({ id, setor, titulo, prioridade, detalhes, indicadores }) {
    return {
        id,
        somenteLeitura: true,
        etapa_kanban: 'Pendente',
        titulo,
        detalhes,
        observacoes_gerenciais: detalhes.join(' | '),
        setor_origem: setor,
        tipo_card: 'Resumo Setor',
        prioridade,
        indicadores
    };
}

class GerenciaService {
    static get ETAPAS_KANBAN_GERENCIA() {
        return ETAPAS_KANBAN_GERENCIA;
    }

    static async obterPainel(filtros = {}) {
        const [pedidos, indicadores, pedidosParados, pedidosAtrasados] = await Promise.all([
            GerenciaModel.painelConsolidado(filtros),
            GerenciaModel.indicadores(),
            GerenciaModel.listarPedidosParados(filtros.dias_limite || 7),
            GerenciaModel.listarPedidosAtrasados()
        ]);

        return { pedidos, indicadores, pedidosParados, pedidosAtrasados };
    }

    static async obterIndicadores() {
        return await GerenciaModel.indicadores();
    }

    static async listarPedidosParados(diasLimite = 7) {
        return await GerenciaModel.listarPedidosParados(diasLimite);
    }

    static async listarPedidosAtrasados() {
        return await GerenciaModel.listarPedidosAtrasados();
    }

    static async visaoPorVendedor() {
        return await GerenciaModel.visaoPorVendedor();
    }

    static async visaoPorResponsavel() {
        return await GerenciaModel.visaoPorResponsavel();
    }

    static async listarKanban(filtros = {}) {
        const [cardsGerenciais, resumosSetoriais] = await Promise.all([
            GerenciaService.listarCardsGerenciais(filtros),
            GerenciaService.montarResumosSetoriais(filtros.dias_limite || 7)
        ]);

        return {
            etapas: ETAPAS_KANBAN_GERENCIA,
            cardsGerenciais,
            resumosSetoriais
        };
    }

    static async listarCardsGerenciais(filtros = {}) {
        const filtrosValidados = { ...filtros };
        if (filtrosValidados.etapa_kanban) {
            filtrosValidados.etapa_kanban = validarValorPermitido(filtrosValidados.etapa_kanban, ETAPAS_KANBAN_GERENCIA, 'etapa_kanban');
        }
        if (filtrosValidados.setor_origem) {
            filtrosValidados.setor_origem = validarValorPermitido(filtrosValidados.setor_origem, SETORES_KANBAN_GERENCIA, 'setor_origem');
        }
        if (filtrosValidados.tipo_card) {
            filtrosValidados.tipo_card = validarValorPermitido(filtrosValidados.tipo_card, TIPOS_CARD_GERENCIA, 'tipo_card');
        }
        if (filtrosValidados.prioridade) {
            filtrosValidados.prioridade = validarValorPermitido(filtrosValidados.prioridade, PRIORIDADES_GERENCIA, 'prioridade');
        }

        const cards = await KanbanGerenciaModel.listarCards(filtrosValidados);
        return cards.map(formatarCard);
    }

    static async buscarCardGerencial(id) {
        const card = await KanbanGerenciaModel.buscarPorId(id);
        if (!card) throw AppError.notFound('Card gerencial não encontrado.');
        return formatarCard(card);
    }

    static async criarCardGerencial(dados, usuario = {}) {
        const payload = montarDadosCard(dados, usuario, true);
        const resultado = await KanbanGerenciaModel.criarCard(payload);
        return await GerenciaService.buscarCardGerencial(resultado.insertId);
    }

    static async atualizarCardGerencial(id, dados, usuario = {}) {
        await GerenciaService.buscarCardGerencial(id);
        const payload = montarDadosCard(dados, usuario, false);

        if (Object.keys(payload).length <= 2) {
            throw AppError.badRequest('Nenhum campo válido para atualizar.');
        }

        const afetados = await KanbanGerenciaModel.atualizarCard(id, payload);
        if (afetados === 0) throw AppError.notFound('Card gerencial não encontrado.');
        return await GerenciaService.buscarCardGerencial(id);
    }

    static async moverCardGerencial(id, etapa, usuario = {}) {
        const etapaValidada = validarValorPermitido(etapa, ETAPAS_KANBAN_GERENCIA, 'etapa_kanban');
        await GerenciaService.buscarCardGerencial(id);
        const afetados = await KanbanGerenciaModel.atualizarEtapa(id, etapaValidada, dadosAuditoria(usuario));
        if (afetados === 0) throw AppError.notFound('Card gerencial não encontrado.');
        return await GerenciaService.buscarCardGerencial(id);
    }

    static async deletarCardGerencial(id) {
        await GerenciaService.buscarCardGerencial(id);
        const afetados = await KanbanGerenciaModel.deletarCard(id);
        if (afetados === 0) throw AppError.notFound('Card gerencial não encontrado.');
        return { sucesso: true, removido: true, id: Number(id) };
    }

    static async montarResumosSetoriais(diasLimite = 7) {
        const resumos = await GerenciaModel.resumosSetoriais(diasLimite);

        const vendas = resumos.vendas || {};
        const arquitetura = resumos.arquitetura || {};
        const financeiro = resumos.financeiro || {};
        const producao = resumos.producao || {};

        return [
            montarCardResumo({
                id: 'resumo-vendas',
                setor: 'Vendas',
                titulo: 'Resumo de Vendas',
                prioridade: numero(vendas.slas_estourados) > 0 ? 'Urgente' : 'Media',
                indicadores: vendas,
                detalhes: [
                    `Cards em aberto: ${numero(vendas.cards_em_aberto)}`,
                    `Contato: ${numero(vendas.leads_contato)}`,
                    `Orcamento: ${numero(vendas.leads_orcamento)}`,
                    `SLAs estourados: ${numero(vendas.slas_estourados)}`
                ]
            }),
            montarCardResumo({
                id: 'resumo-arquitetura',
                setor: 'Arquitetura',
                titulo: 'Resumo de Arquitetura',
                prioridade: numero(arquitetura.matrizes_pendentes) > 0 || numero(arquitetura.entregas_atrasadas) > 0 ? 'Alta' : 'Media',
                indicadores: arquitetura,
                detalhes: [
                    `Cards em arquitetura: ${numero(arquitetura.cards_arquitetura)}`,
                    `Matrizes pendentes: ${numero(arquitetura.matrizes_pendentes)}`,
                    `Cards parados: ${numero(arquitetura.cards_parados)}`,
                    `Entregas atrasadas: ${numero(arquitetura.entregas_atrasadas)}`
                ]
            }),
            montarCardResumo({
                id: 'resumo-financeiro',
                setor: 'Financeiro',
                titulo: 'Resumo Financeiro',
                prioridade: numero(financeiro.pendencias_validacao) > 0 || numero(financeiro.pendencias_fiscais) > 0 ? 'Alta' : 'Media',
                indicadores: financeiro,
                detalhes: [
                    `Cards financeiros: ${numero(financeiro.cards_financeiros)}`,
                    `Pendencias de validacao: ${numero(financeiro.pendencias_validacao)}`,
                    `Liberados para producao: ${numero(financeiro.liberados_producao)}`,
                    `Pendencias fiscais: ${numero(financeiro.pendencias_fiscais)}`
                ]
            }),
            montarCardResumo({
                id: 'resumo-producao',
                setor: 'Producao',
                titulo: 'Resumo de Producao',
                prioridade: numero(producao.atrasos_entrega) > 0 ? 'Urgente' : 'Media',
                indicadores: producao,
                detalhes: [
                    `Cards em producao: ${numero(producao.cards_producao)}`,
                    `Fila: ${numero(producao.fila)}`,
                    `Fabricacao: ${numero(producao.fabricacao)}`,
                    `Expedicao: ${numero(producao.expedicao)}`,
                    `Atrasos de entrega: ${numero(producao.atrasos_entrega)}`
                ]
            })
        ];
    }
}

module.exports = GerenciaService;
