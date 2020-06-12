const JsonReturn = require('../../../helpers/json-return');

module.exports = (req, res) => {
    const ret = new JsonReturn();

    const products = req.db.get('products')
        .filter({
            actived: true,
        })
        .sortBy('name')
        .value();

    ret.addContent('products', products);

    return res.status(ret.getCode()).json(ret.generate());
};
