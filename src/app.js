onst express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');
const crmRoutes = require('./routes/crmRoutes');
const notificacoesComRoutes = require('./routes/notificacoes_comRoutes');
const notificacoesFinRoutes = require('./routes/notificacoes_finRoutes');
const notificacoesArqRoutes = require('./routes/notificacoes_arqRoutes');
const authRoutes = require('./routes/autenticacaoRoutes');
const funcRoutes = require('./routes/funcionarioRoutes');
const permissoesRoutes = require('./routes/permissoesRoutes');
const producaoRoutes = require('./routes/producaoRoutes');
const matrizRoutes = require('./routes/matrizRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const arquiteturaRoutes = require('./routes/arquiteturaRoutes');
const { manipuladorErros, rotaNaoEncontrada } = require('./middlewares/erroMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

app.use('/leads', leadRoutes);
app.use('/crm', crmRoutes);
app.use('/notificacoes-com', notificacoesComRoutes);
app.use('/notificacoes-fin', notificacoesFinRoutes);
app.use('/notificacoes-arq', notificacoesArqRoutes);
app.use('/auth', authRoutes);
app.use('/funcionarios', funcRoutes);
app.use('/permissoes', permissoesRoutes);
app.use('/producao', producaoRoutes);
app.use('/matriz', matrizRoutes);
app.use('/vendas', vendaRoutes);
app.use('/arquitetura', arquiteturaRoutes);

const PREFIXOS_API = [
    '/auth', '/funcionarios', '/permissoes', '/leads', '/crm',
    '/vendas', '/producao', '/matriz', '/notificacoes-com',
    '/notificacoes-fin', '/notificacoes-arq', '/arquitetura'
];

app.use((req, res, next) => {
    if (PREFIXOS_API.some(prefixo => req.path.startsWith(prefixo))) {
        return rotaNaoEncontrada(req, res, next);
    }
    next();
});

const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.use(manipuladorErros);

module.exports = app;
