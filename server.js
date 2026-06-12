require('dotenv').config();

const { validarConfiguracao } = require('./src/config/validarEnv');
const app = require('./src/app');
const db = require('./src/config/database');
const iniciarAgendamentos = require('./src/scheduler');

validarConfiguracao();

const PORT = process.env.PORT || 3000;

db.getConnection()
    .then(connection => {
        console.log('✅ Conexão com o MySQL do Aiven estabelecida!');
        connection.release();

        iniciarAgendamentos();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor da IPF Molduras rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ ERRO CRÍTICO: Não foi possível conectar ao banco de dados');
        console.error(err.message);
        process.exit(1);
    });
