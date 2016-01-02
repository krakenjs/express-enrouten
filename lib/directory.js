'use strict';

var fs = require('fs');
var path = require('path');
var minimatch = require('minimatch');
var registry = require('./registry');
var debug = require('debuglog')('enrouten/directory');


module.exports = function directory(router, config, routerOptions) {
    var handler;
    handler = createFileHandler(router, routerOptions);
    traverse(config.path, '', '', config.ignore, handler);
    return router;
};


/**
 * Traverses the provided basedir, invoking the provided function when a file
 * is encountered.
 * @param basedir the root directory where the traversal should begin
 * @param ancestors the relative path from the basedir to the current dir
 * @param current the current directory name
 * @param ignore an array of file patterns to ignore (uses glob-style patterns, eg: ['controllers/**', '/notMe.js'])
 * @param fn the function to invoke when a file is encountered: `function (basedir, ancestors, current)`
 */
function traverse(basedir, ancestors, current, ignore, fn) {
    var abs, stat;

    abs = path.join(basedir, ancestors, current);

    //If this file matches any of the patterns in the "ignore" configuration, skip it.
    var ignorable = ignore.some(function (pattern) {
        //Make the file path pseudo-absolute, so that the ignore patterns can be properly applied.
        var file = path.join('/', ancestors, current);
        return minimatch(file, pattern, {matchBase: true})
    });

    if (ignorable) {
        return;
    }

    stat = fs.statSync(abs);

    if (stat.isDirectory()) {
        ancestors = ancestors ? path.join(ancestors, current) : current;
        fs.readdirSync(abs).forEach(function (child) {
            traverse(basedir, ancestors, child, ignore, fn);
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
