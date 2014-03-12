'use strict';

var assert = require('assert');

/**
 * The `routes` configuration option handler.
 */
module.exports = function routes(router, options) {
    if (Array.isArray(options)) {
        options.forEach(function (def) {
            var method;

            assert(def.path, 'path is required');
            assert(typeof def.handler === 'function', 'handler is required');

            method = (def.method || 'get').toLowerCase();
            router[method](def.path, def.handler);
        });
    }

    return router;
};
