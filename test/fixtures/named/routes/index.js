'use strict';


module.exports = function (router) {


    router({ path: '/', name: 'my-foo' })
        .get(function (req, res) {
            res.send('ok');
        });

    router({ path: '/bar', name: 'my-bar' })
        .get(function (req, res) {
            res.send('ok');
        });

    router({ path: '/bar/:id', name: 'the-bar' })
        .get(function (req, res) {
            res.send('ok');
        });

};
