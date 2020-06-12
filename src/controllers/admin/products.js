module.exports = (req, res) => {
    return res.render('admin/products', {
        page: req.path,
    });
};
