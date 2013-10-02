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
