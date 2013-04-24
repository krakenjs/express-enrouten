'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('assert');



function scan(file, controllers) {
    var stats;

    controllers = controllers || [];

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


module.exports = function (app) {

    return {
        withRoutes: function (settings) {
            var directory;

            settings = settings || {};

            // Directory to scan for routes
            directory = settings.directory;
            if (directory && fs.statSync(directory).isDirectory()) {
                directory = path.resolve(directory);
                scan(directory).forEach(function (file) {
                    var controller = require(file);
                    if (typeof controller === 'function' && controller.length === 1) {
                        controller(app);
                    }
                });
            }

            (settings.routes || []).forEach(function (def) {
                assert.ok(def.path, 'path is required');
                assert.ok(typeof def.handler === 'function', 'handler is required');

                var method = (def.method || 'get').toLowerCase();
                app[method](def.path, def.handler);
            });

        }
    };

};

