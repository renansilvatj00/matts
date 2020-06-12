const express = require('express');

const router = express.Router();

router.get('/', require('./controllers/site'));

router.use('/admin', require('./controllers/admin'));

router.use('/api', require('./controllers/api'));

module.exports = router;
