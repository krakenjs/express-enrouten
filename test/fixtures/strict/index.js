'use strict';

//
//XXX: the trailing slashes in this file are very important,
// if you change them you will likely break some tests
//
module.exports = function (router) {

    router.get('/', function (req, res) {
        res.send('ok');
    });

    router.get('/strict', function (req, res) {
        res.send('ok');
    });

    router.get('/very-strict/', function (req, res) {
        res.send('ok');
    });

};
