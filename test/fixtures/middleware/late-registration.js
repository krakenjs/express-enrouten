'use strict';


module.exports = function (app) {

    app.use('/foo', function (req, res, next) {
        req.foo = true;
        next();
    });

    app.get('/foo', function (req, res) {
        if (req.foo) {
            res.send(200, 'ok');
            return;
        }
        res.send(500, 'not ok');
    });

};