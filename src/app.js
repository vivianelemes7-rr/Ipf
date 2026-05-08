const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');
const crmRoutes = require('./routes/crmRoutes');
const notificacoesComRoutes = require('./routes/notificacoes_comRoutes');
const authRoutes = require('./routes/autenticacaoRoutes');
const funcRoutes = require('./routes/funcionarioRoutes');
const manipuladorErros = require('./middlewares/erroMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/notificacoes-com', notificacoesComRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/funcionarios', funcRoutes);

app.use(manipuladorErros);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

module.exports = app;

