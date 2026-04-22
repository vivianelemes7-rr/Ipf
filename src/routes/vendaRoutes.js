const express = require('express');
const router = express.Router();
const VendaController = require('../controllers/vendaController');

router.post('/converter', VendaController.converter);

module.exports = router;

