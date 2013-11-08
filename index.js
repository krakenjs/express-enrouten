/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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
