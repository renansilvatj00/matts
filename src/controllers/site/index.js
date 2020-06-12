module.exports = (req, res) => {
    return res.render('site', {
        page: req.path,
    });
};
