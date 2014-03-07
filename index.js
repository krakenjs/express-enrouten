/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
'use strict';

var fs = require('fs');
var path = require('path');
var caller = require('caller');
var assert = require('assert');
var express = require('express');
var debug = require('debuglog')('enrouten');


/**
 * The main entry point for this module. Creates middleware
 * to be mounted to a parent application.
 * @param options the configuration settings for this middleware instance
 * @returns {Function} express middleware
 */
module.exports = function enrouten(options) {
    var app;

    options = options || {};
    options.basedir = options.basedir || path.dirname(caller());

    app = express();
    app.once('mount', mount(app, options));

    return app;
};


/**
 * Creates the onmount handler used to process teh middelwarez
 * @param app the sacrificial express app to use.
 * @param options the configuration settings to use when scanning
 * @returns {Function}
 */
function mount(app, options) {

    return function onmount(parent) {
        var router, handler;

        // Remove sacrificial express app and keep a
        // copy of the currently registered items.
        /// XXX: caveat emptor, private member
        parent._router.stack.pop();

        // Process the configuration, adding to the stack
        router = new express.Router();

        if (typeof options.index === 'string') {
            options.index = resolve(options.basedir, options.index);
            index(router, options.index);
        }

        if (typeof options.directory === 'string') {
            options.directory = resolve(options.basedir, options.directory);
            directory(options.directory, '', '', createFileHandler(router));
        }

        if (typeof options.routes === 'object') {
            routes(router, options.routes);
        }

        debug('mouting routes at', app.mountpath);
        parent.use(app.mountpath, router);
    };

}


/**
 * The `index` configuration option handler
 * @param router the router against which routes shuld be registered
 * @param file the file to load
 * @returns the provided router instance
 */
function index(router, file) {
    var module;

    module = require(file);
    assert.equal(typeof module, 'function', 'An index file must export a function.');
    assert.equal(module.length, 1, 'An index file must export a function that accepts a single argument.');

    debug('loading index file', file);
    module(router);

    return router;
}


/**
 * The `directory` configuration option handler. Recursively
 * traverses the provided basedir, invoking the provided
 * function when a file is encountered
 * @param basedir the root directory where the traversal should begin
 * @param ancesors the relative path from the basedir to the current dir
 * @param current the current directory name
 * @param fn the function to invoke when a file is encountered: `function (basedir, ancestors, current)`
 */
function directory(basedir, ancestors, current, fn) {
    var abs, stat;

    abs = path.join(basedir, ancestors, current);
    stat = fs.statSync(abs);

    if (stat.isDirectory()) {
        ancestors = ancestors ? path.join(ancestors, current) : current;
        fs.readdirSync(abs).forEach(function (child) {
            directory(basedir, ancestors, child, fn);
        });
    }

    if (stat.isFile()) {
        fn(basedir, ancestors, current);
    }
}


/**
 * Factory function that produces a fn implementation to
 * provide to the directory handler. Filters file/module
 * for the desired API `function(router)`, determines mount
 * point and mounts the router.
 * @param router the express Router against which child routers are mounted
 * @returns {Function} the implementation function to provide to directory
 */
function createFileHandler(router) {
    return function handler(basedir, ancestors, current) {
        var abs, impl, mountPoint, child;

        abs = path.join(basedir, ancestors, current);

        if (isFileModule(abs)) {
            impl = require(abs);

            if (typeof impl === 'function' && impl.length === 1) {
                mountPoint = ancestors ? ancestors.split(path.sep) : [];
                mountPoint.push(path.basename(current, path.extname(current)));
                mountPoint = '/' + mountPoint.join('/');

                debug('mounting', current, 'at', mountPoint);
                child = new express.Router();
                impl(child);
                router.use(mountPoint, child);
            }
        }
    };
}


/**
 * The `routes` configuration option handler.
 */
function routes(router, options) {
    if (Array.isArray(options)) {
        options.forEach(function (def) {
            var method;

            assert.ok(def.path, 'path is required');
            assert.ok(typeof def.handler === 'function', 'handler is required');

            method = (def.method || 'get').toLowerCase();
            router[method](def.path, def.handler);
        });
    }
    return router;
}


/**
 * Returns true if `require` is able to load the provided file
 * or false if not.
 * http://nodejs.org/api/modules.html#modules_file_modules
 * @param file the file for which to determine module-ness.
 * @returns {boolean}
 */
function isFileModule(file) {
    var ext = path.extname(file);

    try {
        // remove the file extension and use require.resolve to resolve known
        // file types eg. CoffeeScript. Will throw if not found/loadable by node.
        file = ext ? file.slice(0, -ext.length) : file;
        require.resolve(file);
        return true;
    } catch (err) {
        return false;
    }
}


/**
 * Resolves the provide basedir and file, returning
 * and absolute file path.
 * @param basedir the base directory to use in path resolution
 * @param file the absolute or relative file path to resolve.
 * @returns {String} the resolved absolute file path.
 */
function resolve(basedir, file) {
    if (path.resolve(file) === file) {
        // absolute path
        return file;
    }
    return path.join(basedir, file);
}
