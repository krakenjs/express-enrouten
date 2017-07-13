'use strict';

var fs = require('fs');
var path = require('path');

/* EXAMPLE:
 * var routes = routeify('./controllers');
 * Object.keys(routes).forEach(function (fn) {
 * console.log('%s => %s', fn, routes[fn]);
 * });
 * 
 * Looks like:
 * 
 * controllers/index.js => /
 * controllers/companies/{company}.js => /companies/{company}
 * controllers/products/{product}/update.js => /products/{product}/update
 * controllers/products/{product}.js => /products/{product}
 * controllers/suppliers/{supplier}/index.js => /suppliers/{supplier}
 * controllers/users/index.js => /users
 * controllers/users/{user}.js => /users/{user}
 *
 *
 *
 * `routeify.mapDirectory()` supports an `options` argument too:
 *
 * [options.excludeDotFiles] {Boolean}  Excludes dotfiles as well (default: false)
 * [options.fileChooser]     {Function} Function of the form `function (filename)`
 *                                      which must return a {Boolean} value indicating
 *                                      whether the file should be mapped to a route.
 *
 * Example of `options.fileChooser` performing the work done in express-enrouten's
 * `createFileHandler()` function:
 *
 * var options = {
 *   excludeDotFiles: true,
 *   fileChooser: function (filename) {
 *     var impl;
 *     if (isFileModule(filename)) {
 *       impl = require(filename);
 *       if (impl instanceof Function && impl.length === 1) {
 *         return true;
 *       }
 *     }
 *     return false;
 *   }
 * };
 *
 * var routes = routeify('./controllers', options);
 *
 */

/**
 * Maps handlers in directories to routes based on the filename
 * and path to the file.
 *
 * @param basedir {String} Base directory to search for files.
 * @param options {Object} Options used during traversal.
 * @param options.fileChooser {Function} Function taking one argument (current filename) and returning
 *                                       a {boolean} value indicating whether the current file should
 *                                       be mapped to a route.
 * @returns Returns a hash of local filenames to routes appropriate for mounting.
 */
module.exports = function mapDirectory(basedir, options) {
  var routes = {}; // accumulated recursion

  options || (options = {});
  options.fileChooser = options.fileChooser && (typeof options.fileChooser === 'function') ? options.fileChooser : null;

  traverse(basedir, '', '', routes, options)

  return routes;
}

/**
 * Visits `current` w.r.t. `ancestors`, adding a route to the `routes`
 * hash if a filename, or recursively visiting the children of `current`
 * if it is a directory.
 */
function traverse(basedir, ancestors, current, routes, options) {
  var abs, stat;

  abs = path.join(basedir, ancestors, current);
  stat = fs.statSync(abs);

  // no dotted directories
  if (stat.isDirectory() && current.charAt(0) !== '.') {
    ancestors = ancestors ? path.join(ancestors, current) : current;

    var items = fs.readdirSync(abs);

    // sort items alphabetically and with 'index.js' first
    items.sort(directorySorter);

    items.forEach(function (child) {
      traverse(basedir, ancestors, child, routes, options);
    });
  }

  if (stat.isFile()) {
    var mountpath, filename, route;

    if (!options.fileChooser || options.fileChooser(abs)) {
      mountpath = ancestors ? ancestors.split(path.sep) : [];

      filename = path.basename(current, path.extname(current));
      if (filename !== 'index') {
        mountpath.push(filename);
      }

      route = createRouteFromPath(mountpath);
      routes[route] = abs;
    }
  }
}

/**
 * Converts `/a/b/{c}/d/{e}` to `/a/b/:c/d/:e`
 */
function createRouteFromPath(pathname) {
  var reRouteSpec = /\{([^\}]+)\}/g;
  return ('/' + pathname.join('/')).replace(reRouteSpec, ':$1');
}

/**
 * Sorts `index.js` before all other items.
 */
function directorySorter(a, b) {
  if (a === b) {
    return 0;
  }
  else if (a === 'index.js') {
    return -2;
  }
  else if (b === 'index.js') {
    return 2;
  }
  else {
    return (a < b) ? -1 : 1;
  }
}
