const express = require('express');
const router = express.Router();

router.get('/', require('./list'));
router.post('/', require('./store'));
router.put('/:productId', require('./update'));
router.delete('/:productId', require('./delete'));

module.exports = router;
