const express = require('express');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

app.use(express.json());

app.use('/api/leads', leadRoutes);

app.get('/', (req, res) => {
    res.send('🚀 API da IPF Molduras: Sistema de Leads Ativo!');
});

module.exports = app;

