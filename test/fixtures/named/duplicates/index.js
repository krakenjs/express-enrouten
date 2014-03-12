'use strict';


module.exports = function (router) {


    router({ path: '/foo', name: 'my-foo' })
        .get(function (req, res) {
            res.send('ok');
        });

    router({ path: '/bar', name: 'my-foo' })
        .get(function (req, res) {
            res.send('ok');
        });

};
