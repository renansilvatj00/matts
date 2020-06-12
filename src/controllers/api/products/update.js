const JsonReturn = require('../../../helpers/json-return');
const { numberFormat } = require('../../../helpers/number-format');

module.exports = (req, res) => {
    const ret = new JsonReturn();
    ret.addFields(['name', 'description', 'price']);

    try {
        let { name, description, price } = req.body;
        let { productId } = req.params;
        let error = false;

        const currentProduct = req.db
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

        const productExists = req.db
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

        req.db.get('products')
            .find({
                id: productId,
            })
            .assign({
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
};
