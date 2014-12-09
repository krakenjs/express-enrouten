express-enrouten
==================

Route configuration middleware for expressjs.

Note: `express-enrouten >=1.0` is only compatible with `express >=4.0`.
For `express 3.x` support, please use `express-enrouten 0.3.x`.


[![Build Status](https://travis-ci.org/krakenjs/express-enrouten.png)](https://travis-ci.org/krakenjs/express-enrouten)
[![NPM version](https://badge.fury.io/js/express-enrouten.png)](http://badge.fury.io/js/express-enrouten)

### API
#### `app.use(enrouten(options))`
```javascript
var express = require('express'),
    enrouten = require('express-enrouten');

var app = express();
app.use(enrouten({ ... }));
// or app.use('/foo', enrouten({ ... }));
```


### Configuration
express-enrouten supports routes via configuration and convention.
```javascript
app.use(enrouten({ directory: 'routes' }));
```

#### directory
The `directory` configuration option (optional) is the path to a directory.
Specify a directory to have enrouten scan all files recursively to find files
that match the controller-spec API. With this API, the directory structure
dictates the paths at which handlers will be mounted.

```text
controllers
 |-user
     |-create.js
     |-list.js
```
```javascript
// create.js
module.exports = function (router) {
    router.post('/', function (req, res) {
        res.send('ok');
    });
};
```
```javascript
app.use(enrouten({
    directory: 'controllers'
}));
```
Routes are now:
```test
/user/create
/user/list
```

#### index
The `index` configuration option (optional) is the path to the single file to
load (which acts as the route 'index' of the application).
```javascript
app.use(enrouten({
    index: 'routes/'
}));
```
```javascript
// index.js
module.exports = function (router) {

    router.get('/', index);
    router.all(passport.protect).get('/account', account);

    // etc...
};
```

#### routes
The `routes` configuration option (optional) is an array of route definition objects.
Each definition must have a `path` and `handler` property and can have an optional
`method` property (`method` defaults to 'GET').

Optionally, a `middleware` property can be provided to specify an array of middleware `functions`
(with typical `req`, `res` and `next` arguments) for that specific route.

Note that a `handler` has a different function signature than a `controller`. While a
`controller` takes a single argument (a `router`), a `handler` takes the typical
`req` and `res` pair.

```javascript
app.use(enrouten({
    routes: [
        { path: '/',    method: 'GET', handler: require('./routes/index') },
        { path: '/foo', method: 'GET', handler: require('./routes/foo') },
        { path: '/admin', method: 'GET', handler: require('./routes/foo'), middleware: [isAuthenticated] }
    ]
}));
```

#### routerOptions
The `routerOptions` configuration option (optional) allows additional options to be
specified on each Router instance created by `express-enrouten`. Please see the
[Express API documentation](http://expressjs.com/4x/api.html#router) for complete
documentation on each possible option.

```javascript
app.set('case sensitive routing', true);
app.use(enrouten({
    directory: 'controllers',
    routerOptions: {
        caseSensitive: true
    }
}));
```


### Named Routes
For `index` and `directory` configurations there is also support for named routes.
The normal express router that is passed in will always behave as such, but in addition
it can be used to name a route, adding the name and path to `app.locals.enrouten.routes`.
For example:
```javascript
'use strict';

module.exports = function (router) {

    router({ path: '/user/:id', name: 'user-info' })
        .get(function (req, res) {
            res.send('ok');
        });

};
```


### Controller Files
A 'controller' is defined as any `require`-able file which exports a function
that accepts a single argument. Any files with an extension of `.js` (or `.coffee`
if CoffeeScript is registered) will be loaded and if it exports a function that
accepts a single argument then this function will be called. **NOTE: Any file in
the directory tree that matches the API will be invoked/initialized with the
express router object.**

```javascript
// Good :)
// controllers/controller.js
module.exports = function (router) {
    router.get('/', function (req, res) {
        // ...
    });
};

// Bad :(
// Function does not get returned when `require`-ed, use `module.exports`
exports = function (router) {
    // ...
};

// Bad :(
// controllers/other-file-in-same-controller-directory.js
modules.exports = function (config) {
    // `config` will be an express Router
    // ...
};

// Acceptable :)
// controllers/config.json - A non-js file (ignored)
// controllers/README.txt - A non-js file (ignored)
// controllers/util.js - A js file that has a different API than the spec (ignored)
module.exports = {
    importantHelper: function () {

    }
};
```

## Linting
```bash
$ npm run-script lint
```

## Tests
```bash
$ npm test
```

## Coverage
```bash
$ npm run-script cover && open coverage/lcov-report/index.html
```
