'use strict';


// faking a module transpiled from es6
exports.default = function (router) {

    router.get('/', function (req, res) {
        res.send('ok');
    });

};
