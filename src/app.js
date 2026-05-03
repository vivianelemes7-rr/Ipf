const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');
const crmRoutes = require('./routes/crmRoutes'); // Importa as rotas do CRM comercial
const notificacoesComRoutes = require('./routes/notificacoes_comRoutes');
const authRoutes = require('./src/routes/autenticacaoRoutes');
const funcRoutes = require('./src/routes/funcionarioRoutes');
const manipuladorErros = require('./src/middlewares/erroMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadRoutes); // Define que toda rota do CRM começará com /api/crm
app.use('/api/crm', crmRoutes);
app.use('/api/notificacoes-com', notificacoesComRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcRoutes);

app.use(manipuladorErros);

// Rota de teste de saúde (opcional)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

module.exports = app;

