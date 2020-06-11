require("dotenv-safe").config();
const axios = require('axios')
const cookieParser = require('cookie-parser');
const express = require('express');
const expressLayouts = require('express-ejs-layouts')
const helmet = require('helmet');
const http = require('http')
const logger = require('morgan');
const jwt = require('jsonwebtoken');

const JsonReturn = require('./src/helpers/json-return');

function number_format(number, decimals, decPoint, thousandsSep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    var s = ''

    var toFixedFix = function (n, prec) {
        if (('' + n).indexOf('e') === -1) {
            return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
        } else {
            var arr = ('' + n).split('e')
            var sig = ''
            if (+arr[1] + prec > 0) {
                sig = '+'
            }
            return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
        }
    }

    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }

    return s.join(dec)
}

const shortid = require('shortid')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./src/db/files/db.json')
const db = low(adapter)

// Set some defaults
db.defaults({ products: [] }).write()

const app = express();

app.set('view engine', 'ejs')
app.disable('view cache');

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(logger('dev'));
app.use(helmet());
app.use(cookieParser());

app.get('/', (req, res) => {
    return res.render('site', {
        page: req.path,
    });
});

app.get('/admin', (req, res) => {
    return res.redirect('/admin/login');
});

app.get('/admin/login', (req, res) => {
    return res.render('admin/login', {
        page: req.path,
    });
});

app.use('/admin', expressLayouts);

app.get('/admin/dashboard', (req, res) => {
    return res.render('admin/dashboard', {
        page: req.path,
    });
});

app.get('/admin/products', (req, res) => {
    return res.render('admin/products', {
        page: req.path,
    });
});

app.post('/api/auth', (req, res) => {
    const ret = new JsonReturn();
    ret.addFields(['email', 'password']);

    try {
        const { email, password } = req.body;

        let error = false;

        if (email === '') {
            error = true;
            ret.setFieldError('email', true, 'Campo obrigatório.');
        }
        if (password === '') {
            error = true;
            ret.setFieldError('password', true, 'Campo obrigatório.');
        }

        if (error) {
            ret.setCode(400);
            ret.addMessage('Verifique todos os campos.');
            throw new Error();
        }

        if (email !== 'email@email.com' || password !== '123456') {
            ret.setCode(400);
            ret.addMessage('Login inválido.');
            throw new Error();
        }

        const login = {
            id: 1,
        };

        const token = jwt.sign(login, process.env.TOKEN_SECRET);
        ret.addContent('token', token);

        return res.status(ret.getCode()).json(ret.generate());
    } catch (err) {
        ret.setError(true);

        if (ret.getCode() === 200) {
            ret.setCode(500);
        }

        if (err.message) {
            ret.addMessage(err.message);
        }

        return res.status(ret.getCode()).json(ret.generate());
    }
});

app.get('/api/products', (req, res) => {
    const ret = new JsonReturn();

    const products = db.get('products')
        .filter({
            actived: true,
        })
        .sortBy('name')
        .value();

    ret.addContent('products', products);

    return res.status(ret.getCode()).json(ret.generate());
});

app.post('/api/products', (req, res) => {
    const ret = new JsonReturn();
    ret.addFields(['name', 'description', 'price']);

    try {
        let { name, description, price } = req.body;
        let error = false;

        if (!name) {
            error = true;
            ret.setFieldError('name', true, 'Campo obrigatório.');
        }

        if (!price) {
            error = true;
            ret.setFieldError('price', true, 'Campo obrigatório.');
        }

        if (error) {
            ret.setCode(400);
            ret.addMessage('Verifique todos os campos.');
            throw new Error();
        }

        const productExists = db
            .get('products')
            .find({
                name: name,
            })
            .value();

        if (productExists) {
            ret.setCode(400);
            ret.addMessage('Verifique todos os campos.');
            ret.setFieldError('name', true, 'Já existe um produto com este nome.');
            throw new Error();
        }

        const productId = shortid.generate();

        db.get('products')
            .push({
                id: productId,
                name,
                description,
                price: price,
                priceFormatted: number_format(price, 2, ',', '.'),
                actived: true,
            })
            .write();

        const product = db
            .get('products')
            .find({
                id: productId,
            })
            .value();

        ret.addContent('product', product);

        ret.setCode(201);
        ret.addMessage('Produto adicionado com sucesso.');

        return res.status(ret.getCode()).json(ret.generate());
    } catch (err) {
        ret.setError(true);

        if (ret.getCode() === 200) {
            ret.setCode(500);
        }

        if (err.message) {
            ret.addMessage(err.message);
        }

        return res.status(ret.getCode()).json(ret.generate());
    }
});

app.put('/api/products/:productId', (req, res) => {
    const ret = new JsonReturn();
    ret.addFields(['name', 'description', 'price']);

    try {
        let { name, description, price } = req.body;
        let { productId } = req.params;
        let error = false;

        const currentProduct = db
            .get('products')
            .find({
                id: productId,
            })
            .value();

        if (!currentProduct) {
            ret.setCode(404);
            ret.addMessage('Produto não encontrado.');
            throw new Error();
        }

        if (!name) {
            error = true;
            ret.setFieldError('name', true, 'Campo obrigatório.');
        }

        if (!price) {
            error = true;
            ret.setFieldError('price', true, 'Campo obrigatório.');
        }

        if (error) {
            ret.setCode(400);
            ret.addMessage('Verifique todos os campos.');
            throw new Error();
        }

        const productExists = db
            .get('products')
            .find({
                name: name,
            })
            .value();

        if (productExists && productExists.id !== productId) {
            ret.setCode(400);
            ret.addMessage('Verifique todos os campos.');
            ret.setFieldError('name', true, 'Já existe um produto com este nome.');
            throw new Error();
        }

        db.get('products')
            .find({
                id: productId,
            })
            .assign({
                name,
                description,
                price: price,
                priceFormatted: number_format(price, 2, ',', '.'),
                actived: true,
            })
            .write();

        const product = db
            .get('products')
            .find({
                id: productId,
            })
            .value();

        ret.addContent('product', product);

        ret.setCode(200);
        ret.addMessage('Produto editado com sucesso.');

        return res.status(ret.getCode()).json(ret.generate());
    } catch (err) {
        ret.setError(true);

        if (ret.getCode() === 200) {
            ret.setCode(500);
        }

        if (err.message) {
            ret.addMessage(err.message);
        }

        return res.status(ret.getCode()).json(ret.generate());
    }
});

app.delete('/api/products/:productId', (req, res) => {
    const ret = new JsonReturn();

    try {
        let { productId } = req.params;

        const currentProduct = db
            .get('products')
            .find({
                id: productId,
            })
            .value();

        if (!currentProduct) {
            ret.setCode(404);
            ret.addMessage('Produto não encontrado.');
            throw new Error();
        }

        db.get('products')
            .remove({
                id: productId,
            })
            .write();

        ret.setCode(204);
        ret.addMessage('Produto removido com sucesso.');

        return res.status(ret.getCode()).json(ret.generate());
    } catch (err) {
        ret.setError(true);

        if (ret.getCode() === 200) {
            ret.setCode(500);
        }

        if (err.message) {
            ret.addMessage(err.message);
        }

        return res.status(ret.getCode()).json(ret.generate());
    }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const ret = new JsonReturn();
    ret.setError(true);
    ret.setCode(404);
    ret.addMessage('Rota não encontrada.');
    return res.status(ret.getCode()).json(ret.generate());
});

// error handler
app.use(function (err, req, res, next) {
    const ret = new JsonReturn();
    ret.setError(true);
    ret.setCode(err.status || 500);
    ret.addMessage('Erro interno');
    ret.addMessage(err.message);
    return res.status(ret.getCode()).json(ret.generate());
});

var server = http.createServer(app);
server.listen(process.env.PORT, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT}`);
});
