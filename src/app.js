const matrizRoutes = require('./routes/matrizRoutes');

// ... outros middlewares ...

app.use('/api/matrizes', matrizRoutes);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());
module.exports = app;
