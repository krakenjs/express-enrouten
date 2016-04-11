'use strict';

var assert = require('assert');
var debug = require('debuglog')('enrouten/index');
var fs = require('fs');

// scan for all require extensions so stuff like .coffee and .ts will work
function scanRequireExtensions(baseFilename) {
    // .js is the most common case so check that first
    var path = baseFilename + '.js';

    if (fs.existsSync(path)) {
        return path;
    }

    for (var extension in require.extensions) {
        if (extension === '.js' || extension === '.json') {
            // We already checked .js above and .json will not work
            // since we need a function exported
            continue;
        }
        path = baseFilename + extension;
        if (fs.existsSync(path)) {
            return path; // short circuit loop
        }
    }
}

/**
 * The `index` configuration option handler
 * @param router the router against which routes shuld be registered
 * @param file the file to load
 * @returns the provided router instance
 */
module.exports = function index(router, file) {
    var module;
    var fileName = scanRequireExtensions(file)

    module = require(fileName);

    if (typeof module === 'object' && module.default) {
        module = module.default;
    }

    assert.equal(typeof module, 'function', 'An index file must export a function.');
    assert.equal(module.length, 1, 'An index file must export a function that accepts a single argument.');

    debug('loading index file', file);
    module(router);

    return router;
};
