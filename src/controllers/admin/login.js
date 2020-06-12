module.exports = (req, res) => {
    return res.render('admin/login', {
        page: req.path,
    });
};
