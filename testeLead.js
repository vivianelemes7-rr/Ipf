require('dotenv').config();
const LeadModel = require('./src/models/leadModel');

async function rodarTeste() {
    try {
        console.log('🚀 Iniciando teste do LeadModel no Termux...');
        console.log('🔍 Conectando ao banco e buscando cards...');
        
        const cards = await LeadModel.listar();
        
        console.log('\n✅ CONEXÃO E QUERY OK!');
        console.log(`📊 Total de cards encontrados: ${cards.length}`);
        console.log('\n📱 Estrutura de dados retornada (Padrão da Cláudia):');
        console.log(JSON.stringify(cards.slice(0, 2), null, 2)); // Mostra os 2 primeiros para não encher a tela
        
        process.exit(0);
    } catch (objetoErro) {
        console.error('\n❌ ERRO NO TESTE DO MODEL:');
        console.error(objetoErro.message);
        process.exit(1);
    }
}

rodarTeste();
