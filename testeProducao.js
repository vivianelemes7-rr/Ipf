require('dotenv').config();
const ProducaoModel = require('./src/models/producaoModel');

async function rodarTesteProducao() {
    try {
        console.log('🚀 Iniciando teste do ProducaoModel no Termux...');
        
        // 1. Testar a listagem da fila de produção
        console.log('🔍 Procurando registros na fila de produção...');
        const fila = await ProducaoModel.listarFilaProducao();
        
        console.log('\n✅ QUERY DE LISTAGEM OK!');
        console.log(`📊 Total de pedidos na fábrica: ${fila.length}`);
        console.log('\n📱 Estrutura de dados retornada:');
        console.log(JSON.stringify(fila.slice(0, 2), null, 2)); // Mostra os 2 primeiros registros

        // 2. Testar a trava de segurança (Whitelist de tabelas)
        console.log('\n🛡️ Testando a barreira contra SQL Injection...');
        try {
            await ProducaoModel.atualizarStatusFila('usuarios_senhas_falsa', 1, 'Concluído');
            console.log('❌ ERRO CRÍTICO: O sistema aceitou uma tabela fora da whitelist!');
        } catch (erroSeguranca) {
            console.log('✅ SUCESSO: A segurança bloqueou a tabela inválida com sucesso!');
            console.log(`📝 Mensagem do sistema: "${erroSeguranca.message}"`);
        }
        
        process.exit(0);
    } catch (objetoErro) {
        console.error('\n❌ ERRO NO TESTE DO MODEL DE PRODUÇÃO:');
        console.error(objetoErro.message);
        process.exit(1);
    }
}

rodarTesteProducao();
