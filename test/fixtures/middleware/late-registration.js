'use strict';


module.exports = function (router) {

    router.use('/foo', function (req, res, next) {
        req.foo = true;
        next();
    });

    router.get('/foo', function (req, res) {
        if (req.foo) {
            res.send(200, 'ok');
            return;
        }
        res.send(500, 'not ok');
    });

};
