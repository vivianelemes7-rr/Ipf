const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const matrizRoutes = require('./routes/matrizRoutes');
const producaoRoutes = require('./routes/producaoRoutes');
const leadRoutes = require('./routes/leadRoutes');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/matrizes', matrizRoutes);
app.use('/api/producao', producaoRoutes);
app.use('/api/leads', leadRoutes);

module.exports = app;

