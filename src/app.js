onst express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const errorMiddleware = require('./middlewares/errorMiddleware');

const matrizRoutes = require('./routes/matrizRoutes');
const producaoRoutes = require('./routes/producaoRoutes');
const leadRoutes = require('./routes/leadRoutes');
const vendaRoutes = require('./routes/vendaRoutes');

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/matrizes', matrizRoutes);
app.use('/api/producao', producaoRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/vendas', vendaRoutes);

app.use(errorMiddleware);

module.exports = app;

