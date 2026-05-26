require('dotenv').config();
const ArquiteturaModel = require('./src/models/arquiteturaModel');

async function rodarTeste() {
    try {
        console.log('🚀 Iniciando teste do ArquiteturaModel no Termux...');
        console.log('🔍 Conectando ao banco e buscando fila de arquitetura...');

        const fila = await ArquiteturaModel.listarFila();

        console.log('\n✅ CONEXÃO E QUERY OK!');
        console.log(`📊 Total de pedidos na fila: ${fila.length}`);
        console.log('\n📱 Estrutura de dados retornada:');
        console.log(JSON.stringify(fila.slice(0, 2), null, 2));

        // Testa a barreira de segurança das etapas
        console.log('\n🛡️ Testando barreira contra etapas inválidas...');
        try {
            await ArquiteturaModel.atualizarEtapa(1, 'etapa_inexistente');
            console.log('❌ ERRO CRÍTICO: Sistema aceitou etapa inválida!');
        } catch (erroSeguranca) {
            console.log('✅ SUCESSO: Barreira bloqueou etapa inválida!');
            console.log(`📝 Mensagem: "${erroSeguranca.message}"`);
        }

        process.exit(0);
    } catch (objetoErro) {
        console.error('\n❌ ERRO NO TESTE DO MODEL DE ARQUITETURA:');
        console.error(objetoErro.message);
        process.exit(1);
    }
}

rodarTeste();
