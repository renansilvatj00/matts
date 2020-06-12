module.exports = (req, res) => {
    return res.render('admin/dashboard', {
        page: req.path,
    });
};
