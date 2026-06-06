const db = require('../config/database');

const CAMPOS_ATUALIZAVEIS = [
    'nome_contato',
    'empresa',
    'cpf_cnpj',
    'telefone',
    'email',
    'endereco_completo',
    'cidade',
    'estado',
    'origem',
    'status_lead',
    'notas'
];

function montarFiltrosClientes(filtros = {}) {
    const where = ['l.convertido = TRUE', "l.status_lead <> 'Descartado'"];
    const params = [];

    if (filtros.nome) {
        where.push('(l.nome_contato LIKE ? OR l.empresa LIKE ?)');
        params.push(`%${filtros.nome}%`, `%${filtros.nome}%`);
    }

    if (filtros.cidade) {
        where.push('l.cidade = ?');
        params.push(filtros.cidade);
    }

    if (filtros.estado) {
        where.push('l.estado = ?');
        params.push(filtros.estado);
    }

    if (filtros.cpf_cnpj) {
        where.push('l.cpf_cnpj = ?');
        params.push(filtros.cpf_cnpj);
    }

    return { where: where.join(' AND '), params };
}

function montarSelectCliente() {
    return `
        SELECT
            l.id,
            l.nome_contato,
            l.empresa,
            l.cpf_cnpj,
            l.telefone,
            l.email,
            l.endereco_completo,
            l.cidade,
            l.estado,
            l.origem,
            l.data_cadastro,
            l.status_lead,
            l.convertido,
            l.notas,
            COUNT(p.id) AS total_pedidos,
            COALESCE(SUM(p.valor_total_fechado), 0) AS valor_total_comprado,
            MAX(p.data_pedido) AS ultimo_pedido_data
        FROM leads l
        LEFT JOIN pedidos p ON p.lead_id = l.id
    `;
}

const ClienteModel = {
    listarClientes: async (filtros = {}) => {
        const { where, params } = montarFiltrosClientes(filtros);
        const query = `
            ${montarSelectCliente()}
            WHERE ${where}
            GROUP BY l.id
            ORDER BY l.data_cadastro DESC
        `;
        const [rows] = await db.query(query, params);
        return rows;
    },

    buscarClientePorId: async (id) => {
        const query = `
            ${montarSelectCliente()}
            WHERE l.id = ? AND l.convertido = TRUE
            GROUP BY l.id
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    },

    buscarLeadPorId: async (id) => {
        const [rows] = await db.query('SELECT * FROM leads WHERE id = ?', [id]);
        return rows[0];
    },

    buscarPorCpfCnpj: async (cpfCnpj, ignorarId = null) => {
        if (!cpfCnpj) return null;
        const params = [cpfCnpj];
        let query = 'SELECT * FROM leads WHERE cpf_cnpj = ?';

        if (ignorarId) {
            query += ' AND id <> ?';
            params.push(ignorarId);
        }

        const [rows] = await db.query(query, params);
        return rows[0];
    },

    criarCliente: async (dados) => {
        const query = `
            INSERT INTO leads (
                nome_contato,
                empresa,
                cpf_cnpj,
                telefone,
                email,
                endereco_completo,
                cidade,
                estado,
                origem,
                status_lead,
                convertido,
                notas
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?)
        `;
        const params = [
            dados.nome_contato || null,
            dados.empresa || null,
            dados.cpf_cnpj || null,
            dados.telefone || null,
            dados.email || null,
            dados.endereco_completo || null,
            dados.cidade || null,
            dados.estado || null,
            dados.origem || 'Cadastro Manual',
            dados.status_lead || 'Qualificado',
            dados.notas || null
        ];
        const [result] = await db.query(query, params);
        return result;
    },

    atualizarCliente: async (id, dados) => {
        const campos = CAMPOS_ATUALIZAVEIS.filter((campo) => Object.prototype.hasOwnProperty.call(dados, campo));
        if (campos.length === 0) return { affectedRows: 0 };

        const sets = campos.map((campo) => `${campo} = ?`).join(', ');
        const params = campos.map((campo) => dados[campo]);
        params.push(id);

        const [result] = await db.query(`UPDATE leads SET ${sets} WHERE id = ?`, params);
        return result;
    },

    converterLeadEmCliente: async (id) => {
        const [result] = await db.query(
            "UPDATE leads SET convertido = TRUE, status_lead = 'Qualificado' WHERE id = ?",
            [id]
        );
        return result;
    },

    arquivarCliente: async (id) => {
        const [result] = await db.query("UPDATE leads SET status_lead = 'Descartado' WHERE id = ?", [id]);
        return result;
    },

    listarPedidosDoCliente: async (clienteId) => {
        const [rows] = await db.query(
            `SELECT * FROM pedidos WHERE lead_id = ? ORDER BY data_pedido DESC`,
            [clienteId]
        );
        return rows;
    }
};

module.exports = ClienteModel;
