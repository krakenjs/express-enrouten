'use strict';

var fs = require('fs');
var path = require('path');
var registry = require('./registry');
var routeify = require('./routeify');
var debug = require('debuglog')('enrouten/directory');

module.exports = function directory(router, basedir, routerOptions) {
    var routes, options;

    options = {
        fileChooser: hasRequireHandler
    };

    routes = routeify(basedir, options);
    Object.keys(routes).forEach(function (mountpath) {
        var impl, filename, subrouter;

        filename = routes[mountpath];
        impl = require(pathToModuleId(filename));
            
        if (typeof impl === 'function' && impl.length === 1) {
            debug('mounting', filename, 'at', mountpath);
            subrouter = registry(mountpath, router, routerOptions);
            impl(subrouter);
            router.use(mountpath, subrouter._router);
        }
    });

    return router;
}

/**
 * Returns true if `require` is has a handler for this type
 * of file.
 * http://nodejs.org/api/modules.html#modules_file_modules
 * @param file the file for which to determine handlerable-ness.
 * @returns {boolean}
 */
function hasRequireHandler(file) {
    var ext = path.extname(file);

    // Omit dotfiles
    // NOTE: Temporary fix in lieu of more complete (cross platform)
    // fix using file flags/attributes.
    if (path.basename(file, ext)[0] === '.') {
        return false;
    }

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
 * Gets a module ID from a path suitable for `require()`
 * @param pathname the path to a file which should be required.
 * @returns {String} an appropriate module ID for `require()`
 */
function pathToModuleId(pathname) {
    var ext = path.extname(pathname);
    var moduleId = ext ? pathname.slice(0, -ext.length) : pathname;
    return moduleId;
}
