'use strict';

var fs = require('fs');
var path = require('path');
var registry = require('./registry');
var debug = require('debuglog')('enrouten/directory');


module.exports = function directory(router, basedir, options) {
    var handler;
    handler = createFileHandler(router, options);
    traverse(basedir, '', '', handler);
    return router;
};


/**
 * Traverses the provided basedir, invoking the provided function when a file
 * is encountered.
 * @param basedir the root directory where the traversal should begin
 * @param ancesors the relative path from the basedir to the current dir
 * @param current the current directory name
 * @param fn the function to invoke when a file is encountered: `function (basedir, ancestors, current)`
 */
function traverse(basedir, ancestors, current, fn) {
    var abs, stat;

    abs = path.join(basedir, ancestors, current);
    stat = fs.statSync(abs);

    if (stat.isDirectory()) {
        ancestors = ancestors ? path.join(ancestors, current) : current;
        fs.readdirSync(abs).forEach(function (child) {
            traverse(basedir, ancestors, child, fn);
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
 * @param options the options object to pass to each express Router created
 * @returns {Function} the implementation function to provide to direc`tory
 */
function createFileHandler(router, options) {

    return function handler(basedir, ancestors, current) {
        var abs, impl, filename, mountpath, subrouter;

        abs = path.join(basedir, ancestors, current);
        filename = path.basename(current, path.extname(current));

        if (isFileModule(abs)) {
            impl = require(abs);

            if (typeof impl === 'function' && impl.length === 1) {
                // Build current pount path, ignoring `index` in lieu of `/`
                mountpath = ancestors ? ancestors.split(path.sep) : [];
                filename !== 'index' && mountpath.push(filename);
                mountpath = '/' + mountpath.join('/');

                debug('mounting', current, 'at', mountpath);
                subrouter = registry(mountpath, router, options);
                impl(subrouter);
                router.use(mountpath, subrouter._router);
            }
        }
    };

}


/**
 * Returns true if `require` is able to load the provided file
 * or false if not.
 * http://nodejs.org/api/modules.html#modules_file_modules
 * @param file the file for which to determine module-ness.
 * @returns {boolean}
 */
function isFileModule(file) {
    debug('Verifying that ', file, ' is a loadable module');
    var ext = path.extname(file);

    // Omit dotfiles
    // NOTE: Temporary fix in lieu of more complete (cross platform)
    // fix using file flags/attributes.
    if (path.basename(file, ext)[0] === '.') {
        return false;
    }

    try {
        // remove the file extension and use require to resolve known
        // file types eg. CoffeeScript. Will throw if not found/loadable by node.
        file = file.slice(0, file.length -ext.length);
        require(file);

        return true;
    } catch (err) {
        debug('Unable to load ', file, err);
        return false;
    }
}
