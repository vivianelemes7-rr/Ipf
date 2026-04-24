const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');

// Rota POST para cadastrar leads
router.post('/cadastrar', LeadController.criar);

module.exports = router;

