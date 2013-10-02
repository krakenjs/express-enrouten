'use strict';

var controller = require('./controller'),
    subcontroller = require('./subsuperfluous/subcontroller');

module.exports = function (app) {

    app.get('/good', controller);
    app.get('/subgood', subcontroller);

};