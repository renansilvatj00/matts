const JsonReturn = require('../../../helpers/json-return');

module.exports = (req, res) => {
    const ret = new JsonReturn();

    try {
        let { productId } = req.params;

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

        req.db.get('products')
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
};
