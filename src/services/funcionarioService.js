const CHAVE_FUNCIONARIOS = 'ipfEmployees';

const FUNCIONARIOS_PADRAO = [];

function lerFuncionariosBruto() {
    try {
        const conteudo = localStorage.getItem(CHAVE_FUNCIONARIOS);
        if (!conteudo) return null;
        const parsed = JSON.parse(conteudo);
        return Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function salvarFuncionarios(funcionarios) {
    localStorage.setItem(CHAVE_FUNCIONARIOS, JSON.stringify(funcionarios));
}

export function listarFuncionarios() {
    const funcionarios = lerFuncionariosBruto();
    if (funcionarios) return funcionarios;

    salvarFuncionarios(FUNCIONARIOS_PADRAO);
    return FUNCIONARIOS_PADRAO;
}

export function salvarFuncionario(dados) {
    const emailNormalizado = (dados.email || '').trim().toLowerCase();
    if (!emailNormalizado) {
        throw new Error('Informe um e-mail valido.');
    }

    const funcionarios = listarFuncionarios();
    const funcionarioNormalizado = {
        id: dados.id || emailNormalizado,
        nome: (dados.nome || '').trim(),
        email: emailNormalizado,
        senha: (dados.senha || '').trim(),
        papel: dados.papel || 'vendedor',
    };

    const indiceExistente = funcionarios.findIndex((item) => item.email === emailNormalizado);
    if (indiceExistente >= 0) {
        funcionarios[indiceExistente] = {
            ...funcionarios[indiceExistente],
            ...funcionarioNormalizado,
        };
    } else {
        funcionarios.push(funcionarioNormalizado);
    }

    salvarFuncionarios(funcionarios);
    return funcionarioNormalizado;
}

export function excluirFuncionario(email) {
    const emailNormalizado = (email || '').trim().toLowerCase();
    if (!emailNormalizado) return;

    const funcionarios = listarFuncionarios().filter((item) => item.email !== emailNormalizado);
    salvarFuncionarios(funcionarios);
}

export function encontrarFuncionarioPorCredenciais(email, senha) {
    const emailNormalizado = (email || '').trim().toLowerCase();
    const senhaNormalizada = (senha || '').trim();
    if (!emailNormalizado || !senhaNormalizada) return null;

    return (
        listarFuncionarios().find(
            (item) => item.email === emailNormalizado && item.senha === senhaNormalizada
        ) || null
    );
}
