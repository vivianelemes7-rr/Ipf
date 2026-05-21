const logger = {
    info(tag, mensagem) {
        console.log(`[${tag}] ${mensagem}`);
    },
    erro(tag, mensagem, erro) {
        const detalhe = erro?.message ? `: ${erro.message}` : '';
        console.error(`[${tag}] ❌ ${mensagem}${detalhe}`);
    }
};

module.exports = logger;
