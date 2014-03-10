'use strict';

var controller = require('./controller'),
    subcontroller = require('./subsuperfluous/subcontroller');

module.exports = function (router) {

    router.get('/', controller);
    router.get('/good', controller);
    router.get('/subgood', subcontroller);

};
