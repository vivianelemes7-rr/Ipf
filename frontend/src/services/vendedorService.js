const CHAVE_ARMAZENAMENTO = 'vendedores';

function lerVendedores() {
    try {
        const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
        const parseado = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(parseado) ? parseado : [];
    } catch {
        return [];
    }
}

function escreverVendedores(vendedores) {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(vendedores));
}

export function obterTodosVendedores() {
    return lerVendedores();
}

export function encontrarVendedorPorEmail(email = '') {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) {
        return null;
    }

    return lerVendedores().find((vendedor) => vendedor.email?.toLowerCase() === emailNormalizado) || null;
}

export function criarOuAtualizarVendedor(dadosVendedor) {
    const vendedores = lerVendedores();
    const emailNormalizado = dadosVendedor.email.trim().toLowerCase();

    const carga = {
        id: dadosVendedor.id || emailNormalizado,
        nome: dadosVendedor.nome.trim(),
        email: emailNormalizado,
        telefone: dadosVendedor.telefone?.trim() || '',
        metaMensal: Number(dadosVendedor.metaMensal || 0),
        regiao: dadosVendedor.regiao?.trim() || '',
        criadoEm: dadosVendedor.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
    };

    const indiceExistente = vendedores.findIndex((vendedor) => vendedor.email?.toLowerCase() === emailNormalizado);

    if (indiceExistente >= 0) {
        const existente = vendedores[indiceExistente];
        const atualizado = {
            ...existente,
            ...carga,
            criadoEm: existente.criadoEm || carga.criadoEm,
        };

        vendedores[indiceExistente] = atualizado;
        escreverVendedores(vendedores);
        return atualizado;
    }

    vendedores.push(carga);
    escreverVendedores(vendedores);
    return carga;
}

export function excluirVendedor(email = '') {
    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) {
        return false;
    }

    const vendedores = lerVendedores();
    const filtrados = vendedores.filter((v) => v.email?.toLowerCase() !== emailNormalizado);

    if (filtrados.length === vendedores.length) {
        return false;
    }

    escreverVendedores(filtrados);
    return true;
}
