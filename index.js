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

var path = require('path');
var caller = require('caller');
var express = require('express');
var debug = require('debuglog')('enrouten');
var index = require('./lib/index');
var routes = require('./lib/routes');
var registry = require('./lib/registry');
var directory = require('./lib/directory');


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
        var locals, router;

        // Remove sacrificial express app and keep a
        // copy of the currently registered items.
        /// XXX: caveat emptor, private member
        parent._router.stack.pop();
        router = registry(app.mountpath);

        // Process the configuration, adding to the stack
        if (typeof options.index === 'string') {
            options.index = resolve(options.basedir, options.index);
            index(router, options.index);
        }

        if (typeof options.directory === 'string') {
            options.directory = resolve(options.basedir, options.directory);
            directory(router, options.directory);
        }

        if (typeof options.routes === 'object') {
            routes(router, options.routes);
        }

        parent.locals.routes = router.routes;
        debug('mounting routes at', app.mountpath);
        debug(router.routes);
        parent.use(app.mountpath, router._router);
    };

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
