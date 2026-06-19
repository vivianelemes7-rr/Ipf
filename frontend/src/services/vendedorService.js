import { requisicao } from './httpClient';

const ENDPOINT_VENDEDORES = '/funcionarios/vendedores';

function normalizarVendedor(vendedor) {
    return {
        id: vendedor.id,
        nome: vendedor.nome || '',
        email: vendedor.email || '',
        cargo: vendedor.cargo || 'Vendedor',
        statusAtivo: Boolean(vendedor.status_ativo ?? vendedor.statusAtivo ?? true),
        departamento: vendedor.departamento || 'Vendas',
        dataCadastro: vendedor.data_cadastro || vendedor.dataCadastro || '',
    };
}

export async function obterTodosVendedores() {
    const resposta = await requisicao(ENDPOINT_VENDEDORES);

    const lista = Array.isArray(resposta)
        ? resposta
        : Array.isArray(resposta?.dados)
            ? resposta.dados
            : Array.isArray(resposta?.data)
                ? resposta.data
                : Array.isArray(resposta?.vendedores)
                    ? resposta.vendedores
                    : [];

    return lista.map(normalizarVendedor);
}

export async function encontrarVendedorPorEmail(email = '') {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado) {
        return null;
    }

    const vendedores = await obterTodosVendedores();

    return vendedores.find((vendedor) =>
        vendedor.email?.toLowerCase() === emailNormalizado
    ) || null;
}

export async function criarOuAtualizarVendedor(dadosVendedor) {
    const carga = {
        nome: dadosVendedor.nome?.trim(),
        email: dadosVendedor.email?.trim().toLowerCase(),
        departamento: dadosVendedor.departamento?.trim() || 'Vendas',
    };

    if (dadosVendedor.senha?.trim()) {
        carga.senha = dadosVendedor.senha.trim();
    }

    if (dadosVendedor.password?.trim()) {
        carga.password = dadosVendedor.password.trim();
    }

    if (dadosVendedor.id) {
        const resposta = await requisicao(`${ENDPOINT_VENDEDORES}/${dadosVendedor.id}`, {
            metodo: 'PUT',
            corpo: carga,
        });

        return resposta?.dados
            ? normalizarVendedor(resposta.dados)
            : { id: dadosVendedor.id, ...carga };
    }

    const resposta = await requisicao(ENDPOINT_VENDEDORES, {
        metodo: 'POST',
        corpo: carga,
    });

    return resposta?.dados
        ? normalizarVendedor(resposta.dados)
        : {
            id: resposta?.id,
            ...carga,
            cargo: 'Vendedor',
            statusAtivo: true,
        };
}

export async function excluirVendedor(id) {
    if (!id) {
        return false;
    }

    await requisicao(`${ENDPOINT_VENDEDORES}/${id}/desativar`, {
        metodo: 'PATCH',
    });

    return true;
}
