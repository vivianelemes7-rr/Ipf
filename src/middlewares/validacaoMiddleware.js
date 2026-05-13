// 🔧 MIDDLEWARE DE VALIDAÇÃO - Proteção contra Erros Comuns

const validarCadastroFuncionario = (req, res, next) => {
    const { nome, email, cargo, departamento, senha, password } = req.body;
    const erros = [];

    // Validar campos obrigatórios
    if (!nome || nome.trim().length === 0) erros.push('Nome é obrigatório');
    if (!email || email.trim().length === 0) erros.push('Email é obrigatório');
    if (!cargo || cargo.trim().length === 0) erros.push('Cargo é obrigatório');
    if (!departamento || departamento.trim().length === 0) erros.push('Departamento é obrigatório');
    
    const senhaFinal = password || senha;
    if (!senhaFinal || senhaFinal.length < 6) erros.push('Senha é obrigatória e deve ter mínimo 6 caracteres');
    if (senhaFinal && senhaFinal.length > 128) erros.push('Senha muito longa (máximo 128 caracteres)');

    // Validar email format
    const regex_email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regex_email.test(email)) erros.push('Formato de email inválido');

    // Validar nome length
    if (nome && nome.length > 255) erros.push('Nome muito longo (máximo 255 caracteres)');

    // Validar cargo whitelist
    const cargos_validos = ['Vendedor', 'Gerente', 'Administrador', 'Operacional'];
    if (cargo && !cargos_validos.includes(cargo)) {
        erros.push(`Cargo inválido. Valores válidos: ${cargos_validos.join(', ')}`);
    }

    if (erros.length > 0) {
        return res.status(422).json({
            sucesso: false,
            status: 422,
            mensagem: 'Dados inválidos',
            erros: erros
        });
    }

    next();
};

// 🔒 PROTEÇÃO CONTRA SQL INJECTION - Função Segura para Updates Dinâmicos

const construirUpdateSeguro = (tabela, dados, camposValidos) => {
    // Filtrar apenas campos válidos
    const campos_filtrados = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => `${c} = ?`);

    if (campos_filtrados.length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
    }

    const valores = Object.keys(dados)
        .filter(c => camposValidos.includes(c))
        .map(c => dados[c]);

    const query = `UPDATE ${tabela} SET ${campos_filtrados.join(', ')} WHERE id = ?`;
    return { query, valores };
};

// Exemplo de uso:
// const { query, valores } = construirUpdateSeguro(
//     'funcionarios',
//     { nome: 'Novo Nome', __proto__: 'hacked' },
//     ['nome', 'email', 'cargo', 'departamento', 'status_ativo']
// );
// await conexao.query(query, [...valores, id]);

// 🛡️ VALIDAÇÃO DE MIDDLEWARE AUTENTICAÇÃO

const verificarAcessoSeguro = (cargos = [], modulo = null) => {
    return (req, res, next) => {
        const auth = req.headers.authorization;
        
        if (!auth) {
            return res.status(401).json({ 
                sucesso: false,
                mensagem: 'Token não fornecido' 
            });
        }

        // Validar formato "Bearer <token>"
        const partes = auth.split(' ');
        if (partes.length !== 2 || partes[0] !== 'Bearer') {
            return res.status(401).json({ 
                sucesso: false,
                mensagem: 'Formato de token inválido. Use: Bearer <token>' 
            });
        }

        try {
            const jwt = require('jsonwebtoken');
            const decoded = jwt.verify(partes[1], process.env.JWT_SECRET);
            
            // Verificar se é Gerente (acesso total)
            if (decoded.cargo === 'Gerente') {
                req.usuario = decoded;
                return next();
            }

            // Verificar cargo
            const cargoOk = cargos.length === 0 || cargos.includes(decoded.cargo);
            if (!cargoOk) {
                return res.status(403).json({ 
                    sucesso: false,
                    mensagem: `Cargo não autorizado. Requerido: ${cargos.join(', ')}` 
                });
            }

            // Verificar módulo
            if (modulo && decoded.permissoes[modulo] !== 1) {
                return res.status(403).json({ 
                    sucesso: false,
                    mensagem: `Módulo ${modulo} não autorizado` 
                });
            }

            req.usuario = decoded;
            next();

        } catch (erro) {
            if (erro.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    sucesso: false,
                    mensagem: 'Token expirado. Faça login novamente' 
                });
            }
            
            return res.status(401).json({ 
                sucesso: false,
                mensagem: 'Token inválido' 
            });
        }
    };
};

// ⏱️ PROTEÇÃO CONTRA DoS - Rate Limiting

const rateLimit = (() => {
    const tentativas = new Map();
    
    return (limite = 5, tempo_janela = 60000) => { // 5 tentativas por minuto
        return (req, res, next) => {
            const chave = req.ip;
            const agora = Date.now();

            if (!tentativas.has(chave)) {
                tentativas.set(chave, []);
            }

            const timestamps = tentativas.get(chave);
            const timestamps_validos = timestamps.filter(t => agora - t < tempo_janela);

            if (timestamps_validos.length >= limite) {
                return res.status(429).json({
                    sucesso: false,
                    mensagem: 'Muitas requisições. Tente novamente em 1 minuto'
                });
            }

            timestamps_validos.push(agora);
            tentativas.set(chave, timestamps_validos);
            next();
        };
    };
})();

// 🔐 VALIDAÇÃO DE JWT_SECRET NO STARTUP

const validarConfiguracao = () => {
    const variaveis_obrigatorias = {
        'JWT_SECRET': { minLen: 32, exemplo: 'Chave aleatória de 32+ caracteres' },
        'DB_HOST': { exemplo: 'host do banco de dados' },
        'DB_USER': { exemplo: 'usuário do banco' },
        'DB_PASSWORD': { exemplo: 'senha do banco' },
        'DB_NAME': { exemplo: 'nome do banco' }
    };

    const erros = [];

    for (const [var_name, config] of Object.entries(variaveis_obrigatorias)) {
        if (!process.env[var_name]) {
            erros.push(`${var_name} não configurado`);
        } else if (config.minLen && process.env[var_name].length < config.minLen) {
            erros.push(`${var_name} muito curto (mínimo ${config.minLen} caracteres)`);
        }
    }

    if (erros.length > 0) {
        console.error('❌ ERROS DE CONFIGURAÇÃO:');
        erros.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }

    console.log('✅ Todas as configurações validadas');
};

module.exports = {
    validarCadastroFuncionario,
    construirUpdateSeguro,
    verificarAcessoSeguro,
    rateLimit,
    validarConfiguracao
};
