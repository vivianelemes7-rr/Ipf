const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const crmRoutes = require('./routes/crmRoutes');
const crmFinanceiroRoutes = require('./routes/crmFinanceiroRoutes');
const notificacoesComRoutes = require('./routes/notificacoes_comRoutes');
const notificacoesFinRoutes = require('./routes/notificacoes_finRoutes');
const notificacoesArqRoutes = require('./routes/notificacoes_arqRoutes');
const notificacoesProducaoRoutes = require('./routes/notificacoes_producaoRoutes');
const notificacoesGerenciaRoutes = require('./routes/notificacoes_gerenciaRoutes');
const authRoutes = require('./routes/autenticacaoRoutes');
const funcRoutes = require('./routes/funcionarioRoutes');
const permissoesRoutes = require('./routes/permissoesRoutes');
const producaoRoutes = require('./routes/producaoRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const matrizRoutes = require('./routes/matrizRoutes');
const arquiteturaRoutes = require('./routes/arquiteturaRoutes');
const gerenciaRoutes = require('./routes/gerenciaRoutes');
const vendaRoutes = require('./routes/vendaRoutes');
const kanbanRoutes = require('./routes/kanbanRoutes');
const notificacoesLogisticaRoutes = require('./routes/notificacoes_logisticaRoutes');
const { manipuladorErros, rotaNaoEncontrada } = require('./middlewares/erroMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

app.use('/leads', leadRoutes);
app.use('/clientes', clienteRoutes);
app.use('/crm', crmRoutes);
app.use('/crmFinanceiro', crmFinanceiroRoutes);
app.use('/notificacoes-com', notificacoesComRoutes);
app.use('/notificacoes-fin', notificacoesFinRoutes);
app.use('/notificacoes-arq', notificacoesArqRoutes);
app.use('/notificacoes-producao', notificacoesProducaoRoutes);
app.use('/notificacoes-gerencia', notificacoesGerenciaRoutes);
app.use('/auth', authRoutes);
app.use('/funcionarios', funcRoutes);
app.use('/permissoes', permissoesRoutes);
app.use('/producao', producaoRoutes);
app.use('/pedidos', pedidoRoutes);
app.use('/matriz', matrizRoutes);
app.use('/arquitetura', arquiteturaRoutes);
app.use('/gerencia', gerenciaRoutes);
app.use('/vendas', vendaRoutes);
app.use('/kanban', kanbanRoutes);
app.use('/notificacoes-logistica', notificacoesLogisticaRoutes);

const PREFIXOS_API = [
    '/auth', '/funcionarios', '/permissoes', '/leads', '/clientes', '/crm', '/crmFinanceiro',
    '/vendas', '/producao', '/pedidos', '/matriz', '/notificacoes-com',
    '/notificacoes-fin', '/notificacoes-arq', '/notificacoes-producao',
    '/notificacoes-gerencia', '/notificacoes-logistica', '/arquitetura', '/gerencia', '/kanban'
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
