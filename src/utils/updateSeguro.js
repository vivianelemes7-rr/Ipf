const AppError = require('./AppError');

const TABELAS_PERMITIDAS = ['funcionarios', 'permissoes'];

/**
 * Monta UPDATE dinâmico apenas com colunas da whitelist (proteção SQL injection).
 * @param {string} tabela
 * @param {object} dados
 * @param {string[]} camposValidos
 * @param {string} colunaWhere - coluna do WHERE (ex.: id, funcionario_id)
 */
function construirUpdateSeguro(tabela, dados, camposValidos, colunaWhere = 'id') {
    if (!TABELAS_PERMITIDAS.includes(tabela)) {
        throw AppError.internal(`Tabela não permitida: ${tabela}`);
    }

    const camposFiltrados = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => `${c} = ?`);

    if (camposFiltrados.length === 0) {
        throw AppError.badRequest('Nenhum campo válido para atualizar');
    }

    const valores = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => dados[c]);

    const query = `UPDATE ${tabela} SET ${camposFiltrados.join(', ')} WHERE ${colunaWhere} = ?`;
    return { query, valores };
}

module.exports = { construirUpdateSeguro, TABELAS_PERMITIDAS };
