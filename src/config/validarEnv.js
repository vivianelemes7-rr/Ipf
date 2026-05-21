function validarConfiguracao() {
    const variaveisObrigatorias = {
        JWT_SECRET: { minLen: 32 },
        DB_HOST: {},
        DB_USER: {},
        DB_PASSWORD: {},
        DB_NAME: {}
    };

    const erros = [];

    for (const [nome, config] of Object.entries(variaveisObrigatorias)) {
        if (!process.env[nome]) {
            erros.push(`${nome} não configurado`);
        } else if (config.minLen && process.env[nome].length < config.minLen) {
            erros.push(`${nome} muito curto (mínimo ${config.minLen} caracteres)`);
        }
    }

    if (erros.length > 0) {
        console.error('❌ ERROS DE CONFIGURAÇÃO:');
        erros.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    }

    console.log('✅ Configuração de ambiente validada');
}

module.exports = { validarConfiguracao };
