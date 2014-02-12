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

var fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    express = require('express');


/**
 * Resolve and recursively scan the provided directory
 * @param dir the directory to scan.
 * @returns {Array} absolute file paths that are able to be loaded by Node code.
 */
function loaddir(dir) {
    return scan(resolve(dir));
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
 * Recursively (synchronously) scans the provided root directory, locating files which
 * are able to be loaded by node.
 * @param dir the root dir to begin scanning
 * @param controllers an array containing the absolute file paths of all found controllers
 * @returns {Array} the controllers array.
 */
function scan(dir, controllers) {
    var stats;

    controllers = controllers || [];

    stats = fs.statSync(dir);

    if (stats.isDirectory())  {
        // recursively scan child files
        fs.readdirSync(dir).forEach(function (child) {
            scan(path.join(dir, child), controllers);
        });
    }

    if (stats.isFile()) {
        // add if valid
        isFileModule(dir) && controllers.push(dir);
    }

    return controllers;
}


/**
 * Helper for resolving a relative file path or array
 * of path segments.
 * @param file file path or array of path segments.
 * @returns {String} the resolved file path
 */
function resolve(file) {
    if (!file) {
        return undefined;
    }

    if (Array.isArray(file)) {
        file = path.join.apply(undefined, file);
    }

    file = path.resolve(file);
    return file;
}


module.exports = function (settings) {
    var app;

    function initialize(app, settings) {
        // If index specified, use it.
        if (settings.index) {
            require(resolve(settings.index))(app);
        }

        // If directory specified, scan
        if (settings.directory) {
            loaddir(settings.directory).forEach(function (file) {
                var controller = require(file);
                if (typeof controller === 'function' && controller.length === 1) {
                    controller(app);
                }
            });
        }

        // Finally, try specified routes
        if (Array.isArray(settings.routes)) {
            settings.routes.forEach(function (def) {
                var method;

                assert.ok(def.path, 'path is required');
                assert.ok(typeof def.handler === 'function', 'handler is required');

                method = (def.method || 'get').toLowerCase();
                app[method](def.path, def.handler);
            });
        }
    }

    function mount(settings) {
        return function onmount(parent) {
            // Remove sacrificial express app
            parent.stack.pop();

            // Process the configuration.
            initialize(parent, settings);

            // Reorganize stack to place router in correct place
            // This could get out of whack if someone registers
            // directly against express prior to calling enrouten.
            // This is done *after* scanning so any middleware registered
            // during scanning is correctly put before the router.
            parent.stack.some(function (middleware, idx, stack) {
                if (middleware.handle.name === 'router') {
                    // If a route was specified when mounting, update the
                    // router middleware to only respond to that route.
                    // e.g. app.use('/foo', enrouten()) is akin to app.use('/foo', app.router);
                    middleware.route = app.route !== '/' ? app.route : '';

                    // Reorder stack
                    stack.splice(idx, 1);
                    stack.push(middleware);
                    return true;
                }
                return false;
            });
        };
    }

    app = express();
    app.once('mount', mount(settings));
    return app;
};
