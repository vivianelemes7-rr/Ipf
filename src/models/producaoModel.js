const conexao = require('../config/database');

const CAMPOS_MATRIZ = ['tipo_producao', 'matriz_pronta_interna', 'matriz_chegou_externa'];
const CAMPOS_DATAS = ['data_inicio_real', 'previsao_entrega_final'];

function selectProducaoCompleta() {
    return `
        SELECT
            kp.id,
            kp.pedido_id,
            kp.arquitetura_id,
            kp.financeiro_id,
            kp.etapa_kanban,
            kp.tipo_producao,
            kp.matriz_pronta_interna,
            kp.matriz_chegou_externa,
            kp.responsavel_producao_id,
            kp.data_inicio_real,
            kp.previsao_entrega_final,
            kp.ultima_atualizacao,
            p.numero_pedido,
            p.tipo_pedido,
            p.status_pedido,
            p.data_pedido,
            p.prazo_entrega_acordado,
            p.valor_total_fechado,
            l.id AS cliente_id,
            l.nome_contato AS cliente_contato,
            l.empresa,
            COALESCE(l.empresa, l.nome_contato) AS cliente_nome,
            f_prod.nome AS responsavel_nome,
            kf.responsavel_fin_id,
            f_fin.nome AS responsavel_financeiro_nome,
            kf.etapa_kanban AS financeiro_etapa,
            kf.status_pagamento,
            kf.liberado_para_producao,
            ka.arquiteto_id,
            f_arq.nome AS arquiteto_nome,
            ka.etapa_kanban AS arquitetura_etapa,
            ka.requer_matriz_externa,
            ka.matriz_recebida_check
        FROM kanban_producao kp
        JOIN pedidos p ON p.id = kp.pedido_id
        LEFT JOIN leads l ON l.id = p.lead_id
        LEFT JOIN funcionarios f_prod ON f_prod.id = kp.responsavel_producao_id
        LEFT JOIN kanban_financeiro kf ON kf.id = kp.financeiro_id OR kf.pedido_id = p.id
        LEFT JOIN funcionarios f_fin ON f_fin.id = kf.responsavel_fin_id
        LEFT JOIN kanban_arquitetura ka ON ka.id = kp.arquitetura_id OR ka.pedido_id = p.id
        LEFT JOIN funcionarios f_arq ON f_arq.id = ka.arquiteto_id
    `;
}

function montarUpdateParcial(tabela, id, dados, camposPermitidos) {
    const campos = camposPermitidos.filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo));
    if (campos.length === 0) return null;

    const sets = campos.map((campo) => `${campo} = ?`).join(', ');
    const params = campos.map((campo) => dados[campo]);
    params.push(id);

    return {
        query: `UPDATE ${tabela} SET ${sets}, ultima_atualizacao = CURRENT_TIMESTAMP WHERE id = ?`,
        params
    };
}

const ProducaoModel = {
    async listarFilaCompleta(filtros = {}) {
        const where = [];
        const params = [];

        if (filtros.etapa_kanban) {
            where.push('kp.etapa_kanban = ?');
            params.push(filtros.etapa_kanban);
        }

        if (filtros.responsavel_producao_id) {
            where.push('kp.responsavel_producao_id = ?');
            params.push(filtros.responsavel_producao_id);
        }

        if (filtros.tipo_producao) {
            where.push('kp.tipo_producao = ?');
            params.push(filtros.tipo_producao);
        }

        const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [linhas] = await conexao.query(
            `${selectProducaoCompleta()} ${sqlWhere} ORDER BY kp.ultima_atualizacao DESC, kp.id DESC`,
            params
        );
        return linhas;
    },

    async listarFilaProducao() {
        return await ProducaoModel.listarFilaCompleta();
    },

    async buscarPorId(id) {
        const [linhas] = await conexao.query(`${selectProducaoCompleta()} WHERE kp.id = ?`, [id]);
        return linhas[0] || null;
    },

    async buscarPorPedidoId(pedidoId) {
        const [linhas] = await conexao.query(`${selectProducaoCompleta()} WHERE kp.pedido_id = ?`, [pedidoId]);
        return linhas[0] || null;
    },

    async criarCardProducao(dados, connection = conexao) {
        const [res] = await connection.query(
            `INSERT INTO kanban_producao (
                pedido_id,
                arquitetura_id,
                financeiro_id,
                etapa_kanban,
                tipo_producao,
                matriz_pronta_interna,
                matriz_chegou_externa,
                responsavel_producao_id,
                data_inicio_real,
                previsao_entrega_final
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                dados.pedido_id,
                dados.arquitetura_id || null,
                dados.financeiro_id || null,
                dados.etapa_kanban || 'Aguardando Liberacao',
                dados.tipo_producao || 'Normal',
                dados.matriz_pronta_interna || false,
                dados.matriz_chegou_externa || false,
                dados.responsavel_producao_id || null,
                dados.data_inicio_real || null,
                dados.previsao_entrega_final || null
            ]
        );
        return res;
    },

    async atualizarEtapa(id, etapa, connection = conexao) {
        const [res] = await connection.query(
            `UPDATE kanban_producao
             SET etapa_kanban = ?, ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [etapa, id]
        );
        return res.affectedRows;
    },

    async atualizarResponsavel(id, responsavelId, connection = conexao) {
        const [res] = await connection.query(
            `UPDATE kanban_producao
             SET responsavel_producao_id = ?, ultima_atualizacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [responsavelId || null, id]
        );
        return res.affectedRows;
    },

    async atualizarMatriz(id, dados, connection = conexao) {
        const update = montarUpdateParcial('kanban_producao', id, dados, CAMPOS_MATRIZ);
        if (!update) return 0;
        const [res] = await connection.query(update.query, update.params);
        return res.affectedRows;
    },

    async atualizarDatas(id, dados, connection = conexao) {
        const update = montarUpdateParcial('kanban_producao', id, dados, CAMPOS_DATAS);
        if (!update) return 0;
        const [res] = await connection.query(update.query, update.params);
        return res.affectedRows;
    },

    async deletar(id, connection = conexao) {
        const [res] = await connection.query('DELETE FROM kanban_producao WHERE id = ?', [id]);
        return res.affectedRows;
    },

    async listarAtrasadosPorEtapa(diasLimite = 2) {
        const [linhas] = await conexao.query(
            `${selectProducaoCompleta()}
             WHERE kp.etapa_kanban NOT IN ('Finalizado', 'Cancelado')
               AND kp.ultima_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY kp.ultima_atualizacao ASC`,
            [diasLimite]
        );
        return linhas;
    },

    async listarMatrizPendente(diasLimite = 2) {
        const [linhas] = await conexao.query(
            `${selectProducaoCompleta()}
             WHERE kp.tipo_producao = 'Especial'
               AND kp.etapa_kanban = 'Aguardando Matriz'
               AND kp.matriz_chegou_externa = FALSE
               AND kp.ultima_atualizacao < DATE_SUB(NOW(), INTERVAL ? DAY)
             ORDER BY kp.ultima_atualizacao ASC`,
            [diasLimite]
        );
        return linhas;
    }
};

module.exports = ProducaoModel;
