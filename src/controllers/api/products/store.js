const JsonReturn = require('../../../helpers/json-return');
const { numberFormat } = require('../../../helpers/number-format');

module.exports = (req, res) => {
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

        const productExists = req.db
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

        const productId = req.shortid.generate();

        req.db.get('products')
            .push({
                id: productId,
                name,
                description,
                price: price,
                priceFormatted: numberFormat(price, 2, ',', '.'),
                actived: true,
            })
            .write();

        const product = req.db
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
};
