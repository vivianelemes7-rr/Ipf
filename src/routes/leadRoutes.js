const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');

router.get('/', LeadController.listar);
router.post('/cadastrar', LeadController.criar);

module.exports = router;

