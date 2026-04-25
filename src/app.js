const express = require('express');
const cors = require('cors');
const leadRoutes = require('./routes/leadRoutes');

const crmRoutes = require('./routes/crmRoutes'); // Importa as rotas do CRM comercial

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/leads', leadRoutes); // Define que toda rota do CRM começará com /api/crm

app.use('/api/crm', crmRoutes);

// Rota de teste de saúde (opcional)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor IPF operante' });
});

module.exports = app;

