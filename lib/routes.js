'use strict';

var assert = require('assert');

/**
 * The `routes` configuration option handler.
 */
module.exports = function routes(router, options) {
    if (Array.isArray(options)) {
        options.forEach(function (def) {
            var method, middleware;

            assert(def.path, 'path is required');
            assert(typeof def.handler === 'function', 'handler is required');

            if (def.middleware) {
                assert(Array.isArray(def.middleware), 'middleware must be an array');
                def.middleware.forEach(function(mw) {
                    assert(typeof mw === 'function', 'middleware must be a function');
                });
            }

            method = (def.method || 'get').toLowerCase();
            middleware = def.middleware || [];

            router[method](def.path, middleware, def.handler);
        });
    }

    return router;
};
