const db = require('../config/database');
const AppError = require('../utils/AppError');

// Direct services/models imports to perform writes/updates
const CRMComercialService = require('./crm_comercialService');
const ArquiteturaService = require('./arquiteturaService');
const ProducaoModel = require('../models/producaoModel');
const CRMFinanceiroService = require('./crm_financeiroService');
const KanbanGerenciaModel = require('../models/kanban_gerenciaModel');

class KanbanService {
    static async getBoards() {
        const [
            vendedorRows,
            arquiteturaRows,
            producaoRows,
            financeiroRows,
            gerenteRows,
            logisticaRows
        ] = await Promise.all([
            // 1. Vendedor (crm_comercial)
            db.query(`
                SELECT crm.id, crm.lead_id, crm.vendedor_id, crm.etapa_kanban, crm.valor_estimado, 
                       crm.prioridade, crm.previsao_fechamento, crm.proposta_url, crm.status_final, 
                       crm.pedido_gerado, crm.numero_pedido, crm.data_movimentacao, crm.observacoes_venda,
                       l.nome_contato AS lead_nome, l.cpf_cnpj, l.endereco_completo, l.origem,
                       f.nome AS vendedor_nome
                FROM crm_comercial crm
                LEFT JOIN leads l ON crm.lead_id = l.id
                LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
                ORDER BY FIELD(crm.etapa_kanban, 'Lead', 'Contato', 'FUP1', 'Orcamento', 'FUP2', 'Fechamento', 'Cadastro', 'Pedido'),
                         crm.prioridade ASC, crm.data_movimentacao DESC
            `).then(([r]) => r),

            // 2. Arquitetura (kanban_arquitetura)
            db.query(`
                SELECT ka.id, ka.pedido_id, ka.arquiteto_id, ka.etapa_kanban, ka.requer_matriz_externa,
                       ka.desenho_enviado_externo, ka.data_envio_externo, ka.previsao_retorno_externo,
                       ka.matriz_recebida_check, ka.link_projeto_drive, ka.data_entrega_prevista,
                       ka.prioridade, ka.ultima_movimentacao,
                       p.numero_pedido, p.tipo_pedido, p.descricao_itens_servicos,
                       l.nome_contato AS cliente_nome
                FROM kanban_arquitetura ka
                JOIN pedidos p ON ka.pedido_id = p.id
                LEFT JOIN leads l ON p.lead_id = l.id
                ORDER BY ka.prioridade ASC, ka.id ASC
            `).then(([r]) => r),

            // 3. Producao (kanban_producao)
            db.query(`
                SELECT kp.id, kp.pedido_id, kp.etapa_kanban, kp.tipo_producao, kp.matriz_pronta_interna,
                       kp.matriz_chegou_externa, kp.responsavel_producao_id, kp.data_inicio_real,
                       kp.previsao_entrega_final, kp.ultima_atualizacao,
                       p.numero_pedido, p.descricao_itens_servicos,
                       COALESCE(l.empresa, l.nome_contato) AS cliente_nome,
                       f.nome AS responsavel_nome
                FROM kanban_producao kp
                JOIN pedidos p ON kp.pedido_id = p.id
                LEFT JOIN leads l ON p.lead_id = l.id
                LEFT JOIN funcionarios f ON kp.responsavel_producao_id = f.id
                ORDER BY kp.ultima_atualizacao DESC, kp.id DESC
            `).then(([r]) => r),

            // 4. Financeiro (kanban_financeiro)
            db.query(`
                SELECT kf.id, kf.pedido_id, kf.responsavel_fin_id, kf.etapa_kanban, kf.valor_total_pedido,
                       kf.status_pagamento, kf.liberado_para_producao, kf.data_vencimento_proxima,
                       kf.ultima_atualizacao,
                       p.numero_pedido, p.tipo_pedido,
                       l.nome_contato AS cliente_nome,
                       f.nome AS responsavel_financeiro_nome
                FROM kanban_financeiro kf
                JOIN pedidos p ON kf.pedido_id = p.id
                LEFT JOIN leads l ON p.lead_id = l.id
                LEFT JOIN funcionarios f ON kf.responsavel_fin_id = f.id
                ORDER BY kf.data_vencimento_proxima ASC, kf.ultima_atualizacao DESC
            `).then(([r]) => r),

            // 5. Gerente (kanban_gerencia)
            db.query(`
                SELECT kg.id, kg.etapa_kanban, kg.titulo, kg.observacoes_gerenciais, kg.prioridade, kg.ultima_atualizacao
                FROM kanban_gerencia kg
                ORDER BY FIELD(kg.prioridade, 'Urgente', 'Alta', 'Media', 'Baixa'), kg.ultima_atualizacao DESC
            `).then(([r]) => r),

            // 6. Logistica (calculated dynamically from pedidos)
            db.query(`
                SELECT p.id, p.numero_pedido, p.status_pedido, p.tipo_pedido, p.descricao_itens_servicos,
                       l.nome_contato AS cliente_nome, kp.etapa_kanban AS producao_etapa,
                       f.nome AS vendedor_nome, kp.ultima_atualizacao
                FROM pedidos p
                LEFT JOIN leads l ON p.lead_id = l.id
                LEFT JOIN kanban_producao kp ON kp.pedido_id = p.id
                LEFT JOIN crm_comercial crm ON crm.id = p.crm_id
                LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
                WHERE p.status_pedido IN ('Finalizado', 'Producao') OR kp.etapa_kanban IN ('Expedicao', 'Finalizado')
                ORDER BY p.id DESC
            `).then(([r]) => r)
        ]);

        return {
            boards: {
                vendedor: {
                    key: 'vendedor',
                    title: 'Kanban de Vendas',
                    columns: [
                        { id: 'lead', title: 'Lead', tone: 'neutral' },
                        { id: 'contato', title: 'Contato', tone: 'neutral' },
                        { id: 'fup1', title: 'FUP1', tone: 'neutral' },
                        { id: 'orcamento', title: 'Orcamento', tone: 'accent' },
                        { id: 'fup2', title: 'FUP2', tone: 'neutral' },
                        { id: 'fechamento', title: 'Fechamento', tone: 'success' },
                        { id: 'cadastro', title: 'Cadastro', tone: 'neutral' },
                        { id: 'pedido', title: 'Pedido', tone: 'success' }
                    ],
                    cards: vendedorRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaComercial(row.etapa_kanban),
                        title: `Lead: ${row.lead_nome || 'Sem Nome'}`,
                        lines: [
                            `Contato: ${row.lead_nome || ''}`,
                            `Valor: R$ ${row.valor_estimado || 0}`
                        ],
                        footer: row.observacoes_venda || `Origem: ${row.origem || 'Interna'}`,
                        seller: row.vendedor_nome || 'Não atribuído',
                        processTag: row.prioridade === 1 ? 'especial' : 'normal',
                        budgetFileName: row.proposta_url ? row.proposta_url.split('/').pop() : null,
                        clientDocument: row.cpf_cnpj || null,
                        clientAddress: row.endereco_completo || null,
                        homologadoCliente: !!row.pedido_gerado,
                        updatedAt: row.data_movimentacao
                    }))
                },
                arquitetura: {
                    key: 'arquitetura',
                    title: 'Kanban de Arquitetura',
                    columns: [
                        { id: 'aguardando', title: 'Aguardando', tone: 'neutral' },
                        { id: 'em_desenho', title: 'Em desenho', tone: 'neutral' },
                        { id: 'producao_matriz', title: 'Produção Matriz', tone: 'accent' },
                        { id: 'fup', title: 'FUP', tone: 'neutral' },
                        { id: 'matriz_pronta', title: 'Matriz pronta', tone: 'neutral' },
                        { id: 'conferencia_matriz', title: 'Conferência matriz', tone: 'neutral' },
                        { id: 'producao', title: 'Produção', tone: 'success' }
                    ],
                    cards: arquiteturaRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaArquitetura(row.etapa_kanban),
                        title: `Projeto ${row.numero_pedido}`,
                        lines: [
                            `Cliente: ${row.cliente_nome || ''}`,
                            `Produto: ${row.descricao_itens_servicos || 'Não especificado'}`
                        ],
                        footer: row.requer_matriz_externa ? 'Requer matriz externa' : 'Interno',
                        processTag: row.tipo_pedido === 'Especial' ? 'especial' : 'normal',
                        budgetFileName: row.link_projeto_drive || null,
                        updatedAt: row.ultima_movimentacao
                    }))
                },
                producao: {
                    key: 'producao',
                    title: 'Kanban de Producao',
                    columns: [
                        { id: 'aguardando', title: 'Aguardando', tone: 'neutral' },
                        { id: 'producao', title: 'Em Producao', tone: 'accent' },
                        { id: 'finalizado', title: 'Finalizado', tone: 'success' }
                    ],
                    cards: producaoRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaProducao(row.etapa_kanban),
                        title: `OS: ${row.numero_pedido}`,
                        lines: [
                            `Cliente: ${row.cliente_nome || ''}`,
                            `Peca: ${row.descricao_itens_servicos || ''}`,
                            `Responsavel: ${row.responsavel_nome || 'Sem responsável'}`
                        ],
                        footer: `Etapa: ${row.etapa_kanban}`,
                        processTag: row.tipo_producao === 'Especial' ? 'especial' : 'normal',
                        updatedAt: row.ultima_atualizacao
                    }))
                },
                financeiro: {
                    key: 'financeiro',
                    title: 'Kanban Financeiro',
                    columns: [
                        { id: 'notificacao', title: 'Notificacao', tone: 'neutral' },
                        { id: 'validacao', title: 'Validacao Financeira', tone: 'neutral' },
                        { id: 'confirmado', title: 'Confirmado', tone: 'accent' },
                        { id: 'alerta', title: 'Alerta Fiscal', tone: 'neutral' },
                        { id: 'nf', title: 'Emissao de NF', tone: 'success' }
                    ],
                    cards: financeiroRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaFinanceiro(row.etapa_kanban),
                        title: `Pedido #${row.numero_pedido}`,
                        lines: [
                            `Cliente: ${row.cliente_nome || ''}`,
                            `Valor: R$ ${row.valor_total_pedido || 0}`,
                            `Status: ${row.status_pagamento || ''}`
                        ],
                        footer: row.data_vencimento_proxima
                            ? `Vencimento: ${new Date(row.data_vencimento_proxima).toLocaleDateString('pt-BR')}`
                            : 'Sem data de vencimento',
                        seller: row.responsavel_financeiro_nome || 'Não atribuído',
                        processTag: row.tipo_pedido === 'Especial' ? 'especial' : 'normal',
                        updatedAt: row.ultima_atualizacao
                    }))
                },
                gerente: {
                    key: 'gerente',
                    title: 'Kanban Gerencial',
                    columns: [
                        { id: 'pendente', title: 'Pendente', tone: 'neutral' },
                        { id: 'andamento', title: 'Em Andamento', tone: 'accent' },
                        { id: 'revisao', title: 'Revisao', tone: 'neutral' },
                        { id: 'aprovado', title: 'Aprovado', tone: 'success' }
                    ],
                    cards: gerenteRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaGerente(row.etapa_kanban),
                        title: row.titulo,
                        lines: [row.observacoes_gerenciais || ''],
                        footer: `Prioridade: ${row.prioridade || 'Media'}`,
                        updatedAt: row.ultima_atualizacao
                    }))
                },
                logistica: {
                    key: 'logistica',
                    title: 'Kanban de Logistica',
                    columns: [
                        { id: 'pronto_envio', title: 'Pronto para envio', tone: 'neutral' },
                        { id: 'expedicao', title: 'Em expedicao', tone: 'accent' },
                        { id: 'entregue', title: 'Entregue', tone: 'success' }
                    ],
                    cards: logisticaRows.map(row => ({
                        id: row.id,
                        columnId: this.normalizarEtapaLogistica(row.status_pedido, row.producao_etapa),
                        title: `Pedido #${row.numero_pedido}`,
                        lines: [
                            `Cliente: ${row.cliente_nome || ''}`,
                            `Status: ${row.status_pedido || ''}`
                        ],
                        footer: row.status_pedido === 'Finalizado' ? 'Entrega Concluída' : (row.producao_etapa || 'Pronto para despacho'),
                        seller: row.vendedor_nome || 'Não atribuído',
                        processTag: row.tipo_pedido === 'Especial' ? 'especial' : 'normal',
                        updatedAt: row.ultima_atualizacao || new Date().toISOString()
                    }))
                }
            }
        };
    }

    // Normalizations (database -> frontend)
    static normalizarEtapaComercial(etapa) {
        const val = String(etapa || '').toLowerCase().trim();
        if (val === 'orçamento') return 'orcamento';
        return val || 'lead';
    }

    static normalizarEtapaArquitetura(etapa) {
        const val = String(etapa || '').toLowerCase().replace(/ /g, '_').trim();
        return val || 'aguardando';
    }

    static normalizarEtapaProducao(etapa) {
        if (['Aguardando Liberacao', 'Aguardando Matriz'].includes(etapa)) return 'aguardando';
        if (['Fila de Corte', 'Fabricacao', 'Acabamento', 'Expedicao'].includes(etapa)) return 'producao';
        if (['Finalizado', 'Cancelado'].includes(etapa)) return 'finalizado';
        return 'aguardando';
    }

    static normalizarEtapaFinanceiro(etapa) {
        if (etapa === 'Entrada') return 'notificacao';
        if (etapa === 'Validacao Financeira') return 'validacao';
        if (['Confirmado', 'Confirmado UC11'].includes(etapa)) return 'confirmado';
        if (etapa === 'Alerta Fiscal') return 'alerta';
        if (etapa === 'Nota Fiscal Emitida') return 'nf';
        return 'notificacao';
    }

    static normalizarEtapaGerente(etapa) {
        if (etapa === 'Em Andamento') return 'andamento';
        return String(etapa || '').toLowerCase().trim() || 'pendente';
    }

    static normalizarEtapaLogistica(statusPedido, producaoEtapa) {
        if (statusPedido === 'Finalizado' || producaoEtapa === 'Finalizado') return 'entregue';
        if (producaoEtapa === 'Expedicao') return 'expedicao';
        return 'pronto_envio';
    }

    // Mapping (frontend -> database stage name)
    static traduzirEtapaParaBanco(boardKey, columnId) {
        const map = {
            vendedor: {
                lead: 'Lead', contato: 'Contato', fup1: 'FUP1', orcamento: 'Orcamento',
                fup2: 'FUP2', fechamento: 'Fechamento', cadastro: 'Cadastro', pedido: 'Pedido'
            },
            arquitetura: {
                aguardando: 'Aguardando', em_desenho: 'Em Desenho', producao_matriz: 'Producao Matriz',
                fup: 'FUP', matriz_pronta: 'Matriz Pronta', conferencia_matriz: 'Conferencia Matriz', producao: 'Producao'
            },
            producao: {
                aguardando: 'Aguardando Liberacao',
                producao: 'Fila de Corte',
                finalizado: 'Finalizado'
            },
            financeiro: {
                notificacao: 'Entrada', validacao: 'Validacao Financeira',
                confirmado: 'Confirmado', alerta: 'Alerta Fiscal', nf: 'Nota Fiscal Emitida'
            },
            gerente: {
                pendente: 'Pendente', andamento: 'Em Andamento', revisao: 'Revisao', aprovado: 'Aprovado'
            }
        };

        return map[boardKey]?.[columnId] || columnId;
    }

    static async getCard(boardKey, cardId) {
        const boardsData = await this.getBoards();
        const board = boardsData.boards[boardKey];
        if (!board) return null;
        return board.cards.find(c => String(c.id) === String(cardId)) || null;
    }

    // Mutation implementations
    static async createCard(boardKey, payload, usuario) {
        if (boardKey === 'gerente') {
            const result = await KanbanGerenciaModel.criarCard({
                titulo: payload.title,
                etapa_kanban: this.traduzirEtapaParaBanco(boardKey, payload.columnId || 'pendente'),
                detalhes_json: JSON.stringify(payload.lines || []),
                observacoes_gerenciais: payload.footer || null,
                prioridade: payload.processTag === 'especial' ? 'Alta' : 'Media'
            }, usuario);
            return await this.getCard(boardKey, result.insertId);
        }

        if (boardKey === 'vendedor') {
            const resultId = await CRMComercialService.createCard({
                lead_id: payload.leadId || payload.id, // Fallbacks
                vendedor_id: usuario.id,
                etapa_kanban: this.traduzirEtapaParaBanco(boardKey, payload.columnId || 'lead'),
                valor_estimado: payload.value || 0,
                prioridade: payload.processTag === 'especial' ? 1 : 2,
                proposta_url: payload.budgetFileName || null,
                observacoes_venda: payload.footer || null,
                numero_pedido: payload.numeroPedido || null
            });
            return await this.getCard(boardKey, resultId);
        }

        throw new AppError(`Criação de cards para o board ${boardKey} não suportada via API de Kanban. Use o fluxo correspondente.`);
    }

    static async updateCard(boardKey, cardId, payload, usuario) {
        const dbId = parseInt(cardId);
        
        // 1. If moving column/stage
        if (payload.columnId) {
            const dbStage = this.traduzirEtapaParaBanco(boardKey, payload.columnId);
            
            if (boardKey === 'vendedor') {
                await CRMComercialService.moverEtapa(dbId, dbStage);
            } else if (boardKey === 'arquitetura') {
                await ArquiteturaService.atualizarEtapa(dbId, dbStage);
            } else if (boardKey === 'producao') {
                await ProducaoModel.atualizarEtapa(dbId, dbStage);
            } else if (boardKey === 'financeiro') {
                await CRMFinanceiroService.updateCard(dbId, { etapa_kanban: dbStage });
            } else if (boardKey === 'gerente') {
                await KanbanGerenciaModel.atualizarEtapa(dbId, dbStage, {
                    atualizado_por_id: usuario.id,
                    atualizado_por_perfil: usuario.cargo || usuario.role
                });
            } else {
                throw new AppError(`Movimentação não suportada para o board ${boardKey}.`);
            }
        }

        // 2. If general card fields update
        const updates = {};
        if (payload.title !== undefined) {
            if (boardKey === 'gerente') updates.titulo = payload.title;
        }
        if (payload.lines !== undefined) {
            if (boardKey === 'gerente') updates.detalhes_json = JSON.stringify(payload.lines);
        }
        if (payload.footer !== undefined) {
            if (boardKey === 'gerente') updates.observacoes_gerenciais = payload.footer;
            if (boardKey === 'vendedor') updates.observacoes_venda = payload.footer;
        }
        if (payload.processTag !== undefined) {
            if (boardKey === 'gerente') updates.prioridade = payload.processTag === 'especial' ? 'Alta' : 'Media';
            if (boardKey === 'vendedor') updates.prioridade = payload.processTag === 'especial' ? 1 : 2;
        }

        if (Object.keys(updates).length > 0) {
            if (boardKey === 'gerente') {
                await KanbanGerenciaModel.atualizarCard(dbId, updates);
            } else if (boardKey === 'vendedor') {
                await CRMComercialService.updateCard(dbId, updates);
            }
        }

        return await this.getCard(boardKey, cardId);
    }

    static async deleteCard(boardKey, cardId) {
        const dbId = parseInt(cardId);
        if (boardKey === 'gerente') {
            await KanbanGerenciaModel.deletarCard(dbId);
        } else if (boardKey === 'vendedor') {
            await CRMComercialService.deleteCard(dbId);
        } else if (boardKey === 'producao') {
            await ProducaoModel.deletar(dbId);
        } else if (boardKey === 'financeiro') {
            await CRMFinanceiroService.deleteCard(dbId);
        } else {
            throw new AppError(`Exclusão não suportada para o board ${boardKey}.`);
        }
        return true;
    }
}

module.exports = KanbanService;
