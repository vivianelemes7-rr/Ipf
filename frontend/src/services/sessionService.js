const CHAVES_ARMAZENAMENTO = {
    TOKEN_AUTENTICACAO: 'authToken',
    USUARIO: 'currentUser',
    PAPEL: 'loginType',
};

function lerJson(chave) {
    try {
        const valorBruto = localStorage.getItem(chave);
        return valorBruto ? JSON.parse(valorBruto) : null;
    } catch {
        return null;
    }
}

function escreverJson(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

export function persistirSessao({ token = '', usuario = null, papel = '' } = {}) {
    if (token) {
        localStorage.setItem(CHAVES_ARMAZENAMENTO.TOKEN_AUTENTICACAO, token);
    }

    if (usuario) {
        escreverJson(CHAVES_ARMAZENAMENTO.USUARIO, usuario);
    }

    if (papel) {
        localStorage.setItem(CHAVES_ARMAZENAMENTO.PAPEL, papel);
    }
}

export function limparSessao() {
    localStorage.removeItem(CHAVES_ARMAZENAMENTO.TOKEN_AUTENTICACAO);
    localStorage.removeItem('token');
    localStorage.removeItem(CHAVES_ARMAZENAMENTO.USUARIO);
    localStorage.removeItem(CHAVES_ARMAZENAMENTO.PAPEL);
}

export function obterTokenAutenticacao() {
    return localStorage.getItem(CHAVES_ARMAZENAMENTO.TOKEN_AUTENTICACAO) || localStorage.getItem('token') || '';
}

export function obterUsuarioAtual() {
    return lerJson(CHAVES_ARMAZENAMENTO.USUARIO);
}

export function obterPapelUsuarioAtual() {
    return localStorage.getItem(CHAVES_ARMAZENAMENTO.PAPEL) || obterUsuarioAtual()?.role || '';
}
