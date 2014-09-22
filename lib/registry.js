/*jshint proto:true*/
'use strict';

var assert = require('assert');
var express = require('express');
var debug = require('debuglog')('enrouten/registry');
var propertyExists = Function.prototype.call.bind(Object.prototype.hasOwnProperty);


function endsWith(str, chars) {
    return str.slice(-chars.length) === chars;
}


function removeSuffix(str, chars) {
    return endsWith(str, chars) ? str.slice(0, -chars.length) : str;
}


module.exports = function create(mountpath, router, options) {
    var routes;

    /**
     * Wrapper for default `express.Router` that will allow registration of
     * name routes.
     * @param options for the current route. Currently supports `path` and `name`.
     */
    function registry(options) {
        var path;

        options = options || {};
        options.name = options.name || undefined;
        options.path = options.path || '/';

        if (typeof options.name === 'string') {
            assert.ok(!propertyExists(registry.routes, options.name), 'A route already exists for the name "' + options.name + '"');

            // Do our best to normalize paths
            path = removeSuffix(registry._mountpath, '/');
            path += options.path;

            if (path !== '/') {
                path = removeSuffix(path, '/');
            }

            debug('Registering name', options.name, 'for path', path);
            registry.routes[options.name] = path;
        }

        return Object.getPrototypeOf(registry).route(options.path);
    }

    // Support composability
    if (typeof router === 'function' && router.name === 'registry') {
        mountpath = removeSuffix(router._mountpath, '/') + mountpath;
        routes = router.routes;
        router = undefined;
    }

    mountpath = mountpath || '/';
    router = router || new express.Router(options);

    registry.routes = routes || Object.create(null);
    registry._mountpath = mountpath;
    registry.__proto__ = router;

    // Recursively search for the first non-registry (express) router.
    Object.defineProperty(registry, '_router', {
        get: function () {
            return router._router || router;
        }
    });

    return registry;

};
