const db = require('../config/database'); // Importa a conexão pool

const ETAPAS_VENDAS = ['Lead', 'Contato', 'FUP1', 'Orcamento', 'FUP2', 'Fechamento', 'Cadastro', 'Pedido'];
const CAMPOS_ATUALIZAVEIS = [
    'etapa_kanban',
    'valor_estimado',
    'prioridade',
    'previsao_fechamento',
    'proposta_url',
    'status_final',
    'motivo_perda',
    'pedido_gerado',
    'observacoes_venda',
    'vendedor_id',
    'numero_pedido',
    'data_primeiro_contato',
    'data_envio_proposta',
    'data_entrada_etapa'
];

function montarUpdate(dados) {
    const campos = CAMPOS_ATUALIZAVEIS.filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo));
    if (campos.length === 0) return null;

    return {
        set: campos.map((campo) => `${campo} = ?`).join(', '),
        valores: campos.map((campo) => dados[campo])
    };
}

class CRMComercialModel {
    // Busca todos os registros do CRM com nomes de referências (Lead e Vendedor)
    static async findAll() {
        const query = `SELECT crm.*, l.nome_contato AS lead_nome, f.nome AS vendedor_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
            ORDER BY FIELD(crm.etapa_kanban, 'Lead', 'Contato', 'FUP1', 'Orcamento', 'FUP2', 'Fechamento', 'Cadastro', 'Pedido'),
                     crm.prioridade ASC,
                     crm.data_movimentacao DESC`;
        const [rows] = await db.query(query);
        return rows;
    }

    // Busca registros filtrados por vendedor (Respeitando a regra 'ver_apenas_proprio')
    static async findByVendedor(vendedor_id) {
        const query = `
            SELECT crm.*, l.nome_contato AS lead_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            WHERE crm.vendedor_id = ?
        `;
        const [rows] = await db.query(query, [vendedor_id]);
        return rows;
    }

    // Busca um registro pelo número único do pedido
    static async findByNumeroPedido(numero_pedido) {
        const query = `
            SELECT crm.*, l.nome_contato AS lead_nome, f.nome AS vendedor_nome 
            FROM crm_comercial crm
            LEFT JOIN leads l ON crm.lead_id = l.id
            LEFT JOIN funcionarios f ON crm.vendedor_id = f.id
            WHERE crm.numero_pedido = ?
        `;
        const [rows] = await db.query(query, [numero_pedido]);
        return rows[0];
    }

    static async findIdleLeads(diasLimite = 7) {
        const query = `
            SELECT crm.id,
                   crm.vendedor_id,
                   crm.etapa_kanban,
                   l.nome_contato,
                   CASE
                       WHEN crm.etapa_kanban = 'Contato' THEN 'primeiro_contato'
                       WHEN crm.etapa_kanban = 'Orcamento' THEN 'proposta'
                       ELSE 'follow_up'
                   END AS tipo_sla
            FROM crm_comercial crm
            JOIN leads l ON crm.lead_id = l.id
            WHERE crm.status_final = 'Em Aberto'
              AND crm.etapa_kanban IN ('Contato', 'Orcamento')
              AND COALESCE(crm.data_entrada_etapa, crm.data_movimentacao) < DATE_SUB(NOW(), INTERVAL ? DAY)`;
        const [rows] = await db.query(query, [diasLimite]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM crm_comercial WHERE id = ?', [id]);
        return rows[0];
    }

    // Cria um novo card no Kanban (Atualizado com numero_pedido)
    static async create(dados) {
        const {
            lead_id,
            vendedor_id,
            etapa_kanban,
            valor_estimado,
            prioridade,
            previsao_fechamento,
            proposta_url,
            observacoes_venda,
            numero_pedido
        } = dados;

        const query = `INSERT INTO crm_comercial
            (lead_id, vendedor_id, etapa_kanban, valor_estimado, prioridade, previsao_fechamento, proposta_url, observacoes_venda, numero_pedido, data_entrada_etapa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;

        const [result] = await db.query(query, [
            lead_id,
            vendedor_id || null,
            etapa_kanban || 'Lead',
            valor_estimado || 0,
            prioridade || 2,
            previsao_fechamento || null,
            proposta_url || null,
            observacoes_venda || null,
            numero_pedido || null // Adicionado
        ]);

        return result.insertId;
    }

    // Atualiza dados do card (Atualizado com numero_pedido)
    static async update(id, dados) {
        const update = montarUpdate(dados);
        if (!update) return 0;

        const [result] = await db.query(
            `UPDATE crm_comercial SET ${update.set}, data_movimentacao = CURRENT_TIMESTAMP WHERE id = ?`,
            [...update.valores, id]
        );

        return result.affectedRows;
    }

    static async moveStage(id, etapa) {
        const [result] = await db.query(
            `UPDATE crm_comercial
             SET etapa_kanban = ?,
                 data_entrada_etapa = CURRENT_TIMESTAMP,
                 data_movimentacao = CURRENT_TIMESTAMP,
                 data_primeiro_contato = CASE
                     WHEN ? = 'Contato' AND data_primeiro_contato IS NULL THEN CURRENT_TIMESTAMP
                     ELSE data_primeiro_contato
                 END
             WHERE id = ?`,
            [etapa, etapa, id]
        );
        return result.affectedRows;
    }

    static async anexarProposta(id, propostaUrl) {
        const [result] = await db.query(
            `UPDATE crm_comercial
             SET proposta_url = ?, data_movimentacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [propostaUrl, id]
        );
        return result.affectedRows;
    }

    static async marcarPropostaEnviada(id) {
        const [result] = await db.query(
            `UPDATE crm_comercial
             SET etapa_kanban = 'Orcamento',
                 data_envio_proposta = CURRENT_TIMESTAMP,
                 data_entrada_etapa = CURRENT_TIMESTAMP,
                 data_movimentacao = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [id]
        );
        return result.affectedRows;
    }

    // Lógica de Fechamento (Atualizado para receber o número do pedido no ato do ganho)
    static async markAsWon(id, numero_pedido) {
        const query = `
            UPDATE crm_comercial SET 
                status_final = 'Ganho', 
                data_ganho = CURRENT_TIMESTAMP,
                etapa_kanban = 'Pedido',
                pedido_gerado = TRUE,
                numero_pedido = ? 
            WHERE id = ?`;
        const [result] = await db.query(query, [numero_pedido, id]);
        return result.affectedRows;
    }

    // Lógica de Fechamento: Marca como Perdido com motivo
    static async markAsLost(id, motivo) {
        const query = `UPDATE crm_comercial SET 
                status_final = 'Perdido', 
                motivo_perda = ?,
                etapa_kanban = 'Arquivado'
            WHERE id = ?`;
        const [result] = await db.query(query, [motivo, id]);
        return result.affectedRows;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM crm_comercial WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

CRMComercialModel.ETAPAS_VENDAS = ETAPAS_VENDAS;

module.exports = CRMComercialModel;
