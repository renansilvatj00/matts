const express = require('express');
const router = express.Router();

router.post('/auth', require('./auth'));
router.use('/products', require('./products'));

module.exports = router;
