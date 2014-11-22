'use strict';

var assert = require('assert');

/**
 * The `routes` configuration option handler.
 */
module.exports = function routes(router, options) {
    if (Array.isArray(options)) {
        options.forEach(function (def) {
            var method, middlewares;

            assert(def.path, 'path is required');
            assert(typeof def.handler === 'function', 'handler is required');

			if (def.middlewares) {
			    assert(Array.isArray(def.middlewares), 'middlewares must be an array');
			    def.middlewares.forEach(function(mw) {
			        assert(typeof mw === 'function', 'middleware must be a function');
			    });
			}

			method = (def.method || 'get').toLowerCase();
			middlewares = def.middlewares || [];

            router[method](def.path, middlewares, def.handler);
        });
    }

    return router;
};
