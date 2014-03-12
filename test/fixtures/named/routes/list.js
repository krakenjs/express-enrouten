'use strict';


module.exports = function (router) {


    router(/* noop */)
        .get(function (req, res) {
            res.send('ok');
        });



    router({ path: '/stuff', name: 'my-list' })
        .get(function (req, res) {
            res.send('ok');
        });

};
