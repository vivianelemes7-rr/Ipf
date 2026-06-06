const conexao = require('../config/database');

const CAMPOS_ATUALIZAVEIS = [
    'columnId', 'title', 'lines', 'footer', 'seller',
    'processTag', 'budgetFileName', 'clientDocument',
    'clientAddress', 'homologadoCliente', 'updatedAt', 'updatedByProfile'
];

const LeadModel = {
    async listar() {
        const [linhas] = await conexao.query('SELECT * FROM leads ORDER BY id');
        return linhas.map(linha => ({
            ...linha,
            lines: linha.lines ? (typeof linha.lines === 'string' ? linha.lines.split('\n') : linha.lines) : [],
            homologadoCliente: Boolean(linha.homologadoCliente)
        }));
    },

    async buscarPorId(id) {
        const [linhas] = await conexao.query('SELECT * FROM leads WHERE id = ?', [id]);
        if (!linhas[0]) return null;
        return {
            ...linhas[0],
            lines: linhas[0].lines ? (typeof linhas[0].lines === 'string' ? linhas[0].lines.split('\n') : linhas[0].lines) : [],
            homologadoCliente: Boolean(linhas[0].homologadoCliente)
        };
    },

    async criar(dadosLead) {
        const nome_contato = dadosLead.nome_contato || dadosLead.title || '';
        const empresa = dadosLead.empresa || '';
        const cpf_cnpj = dadosLead.cpf_cnpj || dadosLead.clientDocument || '';
        const telefone = dadosLead.telefone || '';
        const email = dadosLead.email || '';
        const endereco_completo = dadosLead.endereco_completo || dadosLead.clientAddress || '';
        const cidade = dadosLead.cidade || '';
        const estado = dadosLead.estado || '';
        const origem = dadosLead.origem || '';
        const status_lead = dadosLead.status_lead || dadosLead.columnId || 'Novo';
        const notas = Array.isArray(dadosLead.lines)
            ? dadosLead.lines.join('\n')
            : (dadosLead.notas || dadosLead.lines || '');

        const query = `
            INSERT INTO leads (nome_contato, empresa, cpf_cnpj, telefone, email, endereco_completo, cidade, estado, origem, status_lead, notas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const [res] = await conexao.query(query, [
            nome_contato, empresa, cpf_cnpj, telefone, email,
            endereco_completo, cidade, estado, origem, status_lead, notas
        ]);
        return { insertId: res.insertId };
    },

    async atualizarLead(id, dados) {
        const campos = Object.keys(dados).filter(c => CAMPOS_ATUALIZAVEIS.includes(c));
        if (campos.length === 0) throw new Error('Nenhum campo válido para atualizar');

        const set = campos.map(c => `${c} = ?`).join(', ');
        const valores = campos.map(c => dados[c]);

        const [res] = await conexao.query(
            `UPDATE leads SET ${set} WHERE id = ?`,
            [...valores, id]
        );
        return res.affectedRows;
    },

    async deletar(id) {
        const [res] = await conexao.query('DELETE FROM leads WHERE id = ?', [id]);
        return res.affectedRows;
    }
};

module.exports = LeadModel;
