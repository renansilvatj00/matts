require("dotenv-safe").config();
const cookieParser = require('cookie-parser');
const express = require('express');
const helmet = require('helmet');
const http = require('http')
const logger = require('morgan');

const JsonReturn = require('./src/helpers/json-return');

const shortid = require('shortid');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./src/db/files/db.json');
const db = low(adapter);

db.defaults({ products: [] }).write();

const app = express();

app.set('view engine', 'ejs')
app.disable('view cache');

app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(logger('dev'));
app.use(helmet());
app.use(cookieParser());

app.use((req, res, next) => {
    req.db = db;
    req.shortid = shortid;
    next();
});

app.use(require('./src/routes'));

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
