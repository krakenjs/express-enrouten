/***@@@ BEGIN LICENSE @@@***/
/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
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
/***@@@ END LICENSE @@@***/
'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');


function loaddir(directory) {
    return scan(resolve(directory));
}


function scan(file, controllers) {
    var stats;

    controllers = controllers || [];
    if (typeof file !== 'string') {
        return controllers;
    }

    assert.ok(fs.existsSync(file), 'Route directory not found. (\'' + file + '\')');

    stats = fs.statSync(file);
    if (stats.isDirectory())  {
        fs.readdirSync(file).forEach(function (child) {
            scan(path.join(file, child), controllers);
        });
    } else if (stats.isFile() && file.match(/\.js$/i)) {
        controllers.push(file);
    }

    return controllers;
}


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


module.exports = function (app) {

    return {

        withRoutes: function (settings) {

            settings = settings || {};

            if (settings.index) {
                require(resolve(settings.index))(app);
                return;
            }

            // Directory to scan for routes
            loaddir(settings.directory).forEach(function (file) {
                var controller = require(file);
                if (typeof controller === 'function' && controller.length === 1) {
                    controller(app);
                }
            });

            (settings.routes || []).forEach(function (def) {
                assert.ok(def.path, 'path is required');
                assert.ok(typeof def.handler === 'function', 'handler is required');

                var method = (def.method || 'get').toLowerCase();
                app[method](def.path, def.handler);
            });

        }
    };

};
