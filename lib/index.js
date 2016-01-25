'use strict';

var assert = require('assert');
var debug = require('debuglog')('enrouten/index');

/**
 * The `index` configuration option handler
 * @param router the router against which routes shuld be registered
 * @param file the file to load
 * @returns the provided router instance
 */
module.exports = function index(router, file) {
    var module;

    module = require(file);

    if (typeof module === 'object' && module.default) {
        module = module.default;
    }

    assert.equal(typeof module, 'function', 'An index file must export a function.');
    assert.equal(module.length, 1, 'An index file must export a function that accepts a single argument.');

    debug('loading index file', file);
    module(router);

    return router;
};
