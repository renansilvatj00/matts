const express = require('express');
const expressLayouts = require('express-ejs-layouts')

const router = express.Router();

router.get('/', (req, res) => {
    return res.redirect('/admin/login');
});

router.get('/login', require('./login'));

router.use(expressLayouts);

router.get('/dashboard', require('./dashboard'));
router.get('/products', require('./products'));


module.exports = router;
