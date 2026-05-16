const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');
const crmRoutes = require('./routes/crmRoutes');
const notificacoesComRoutes = require('./routes/notificacoes_comRoutes');
const authRoutes = require('./routes/autenticacaoRoutes');
const funcRoutes = require('./routes/funcionarioRoutes');
const manipuladorErros = require('./middlewares/erroMiddleware');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/leads', leadRoutes);
app.use('/crm', crmRoutes);
app.use('/notificacoes-com', notificacoesComRoutes);
app.use('/auth', authRoutes);
app.use('/funcionarios', funcRoutes);

app.use(manipuladorErros);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

// Servir o front-end React
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});


module.exports = app;

