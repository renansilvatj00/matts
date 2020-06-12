require("dotenv-safe").config();
const jwt = require('jsonwebtoken');
const JsonReturn = require('../../helpers/json-return');

module.exports = (req, res) => {
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
};
