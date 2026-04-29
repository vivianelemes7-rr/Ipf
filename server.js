require('dotenv').config();

const app = require('./src/app');
const db = require('./src/config/database');
const iniciarAgendamentos = require('./src/scheduler');

const PORT = process.env.PORT || 3000;

// Testar a conexão com o banco antes de subir o servidor
db.getConnection()
    .then(connection => {
        console.log('✅ Conexão com o MySQL do Aiven estabelecida!');
        connection.release();

        // Inicie os agendamentos aqui, após a conexão com o banco
        iniciarAgendamentos();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor da IPF Molduras rodando na porta ${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Erro ao conectar no banco:', err.message);
        // Mesmo com erro no banco, vamos subir o servidor para não travar

        app.listen(PORT, () => {
            console.log(`⚠️ Servidor rodando na porta ${PORT} (SEM BANCO DE DADOS)`);
            console.log('⚠️ Agendamentos NÃO iniciados devido à falta de conexão.');
        });
    });


