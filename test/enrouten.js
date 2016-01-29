'use strict';

var test = require('tape');
var path = require('path');
var express = require('express');
var enrouten = require('../');
var request = require('supertest');


test('enrouten', function (t) {

    run(t.test.bind(t), 'root', '', function plain(app, settings) {
        app.use(enrouten(settings));
    });


    run(t.test.bind(t), 'mountpoint', '/foo', function route(app, settings) {
        app.use('/foo', enrouten(settings));
    });
});


function get(app, route, next) {
    request(app)
        .get(route)
        .expect('Content-Type', /html/)
        .expect(200, 'ok', next);
}


function getfail(app, route, status, next) {
    request(app)
        .get(route)
        .expect(status, next);
}


function run(test, name, mount, fn) {

    test(name + ' mounting', function (t) {
        var app;

        app = express();
        fn(app);

        fn(app, { basedir: path.join(__dirname, 'fixtures') });
        fn(app, { directory: null });
        fn(app, { index: null });
        fn(app, { routes: null });
        fn(app, { routes: [] });

        // Enrouten always adds one router, regardless
        // of config.
        t.equal(app._router.stack.length, 8);
        t.end();
    });


    test(name + ' directory', function (t) {

        t.test('relative path', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'flat')
            };

            fn(app, settings);
            get(app, mount + '/controller', function (err) {
                t.error(err);
                t.end();
            });
        });


        t.test('absolute path', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join(__dirname, 'fixtures', 'flat')
            };

            fn(app, settings);
            get(app, mount + '/controller', function (err) {
                t.error(err);
                t.end();
            });
        });


        t.test('unknown extensions (regression)', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join(__dirname, 'fixtures', 'extensions', 'unknown')
            };

            fn(app, settings);
            get(app, mount + '/controller', function (err) {
                t.error(err);
                t.end();
            });
        });


        t.test('custom extensions', function (t) {
            var app, settings;

            require.extensions['.custom'] = require.extensions['.js'];
            
            app = express();
            settings = {
                directory: path.join(__dirname, 'fixtures', 'extensions', 'custom')
            };

            fn(app, settings);
            
            get(app, mount + '/controller', function (err) {
                t.error(err);
                delete require.extensions['.custom'];
                t.end();
            });              
        });


        t.test('throw from required module', function (t) {
            var app, settings;

            t.plan(1);

            app = express();
            settings = {
                directory: path.join(__dirname, 'fixtures', 'badController')
            };

            t.throws(function () {
                fn(app, settings);
            });

            t.end();
        });


        t.test('es6 default export', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'transpiled')
            };

            fn(app, settings);

            get(app, mount + '/controller', function (err) {
                t.error(err);
                t.end();
            });
        });
        
        
        t.test('nested', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'nested')
            };

            fn(app, settings);

            get(app, mount + '/controller', function (err) {
                t.error(err);
                get(app, mount + '/subdirectory/subcontroller', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('router caseSensitive', function (t) {
            var app, settings;

            app = express();
            app.set('case sensitive routing', true);
            settings = {
                directory: path.join('fixtures', 'caseSensitive'),
                routerOptions: {
                    caseSensitive: true
                }
            };

            fn(app, settings);

            get(app, mount + '/caseSensitive', function (err) {
                t.error(err);
                getfail(app, mount + '/casesensitive', 404, function (err) {
                    t.error(err);
                    get(app, mount + '/lowercase', function (err) {
                        t.error(err);
                        getfail(app, mount + '/LOWERCASE', 404, function (err) {
                            t.error(err);
                            get(app, mount + '/UPPERCASE', function (err) {
                                t.error(err);
                                getfail(app, mount + '/uppercase', 404, function (err) {
                                    t.error(err);
                                    t.end();
                                });
                            });
                        });
                    });
                });
            });
        });


        t.test('router strict', function (t) {
            var app, settings;

            app = express();
            app.set('strict routing', true);
            settings = {
                index: path.join('fixtures', 'strict'),
                routerOptions: {
                    strict: true
                }
            };

            fn(app, settings);

            get(app, mount + '/', function (err) {
                t.error(err);
                get(app, mount + '/strict', function (err) {
                    getfail(app, mount + '/strict/', 404, function (err) {
                        t.error(err);
                        get(app, mount + '/very-strict/', function (err) {
                            getfail(app, mount + '/very-strict', 404, function (err) {
                                t.error(err);
                                t.end();
                            });
                        });
                    });
                });
            });
        });


        t.test('index', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'indexed')
            };

            fn(app, settings);

            get(app, mount + '/', function (err) {
                t.error(err);
                get(app, mount + '/good', function (err) {
                    t.error(err);
                    get(app, mount + '/subgood', function (err) {
                        t.error(err);
                        t.end();
                    });
                });
            });
        });


        t.test('missing path', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'undefined')
            };

            t.throws(function () {
                fn(app, settings);
            });

            t.end();
        });


        t.test('invalid api', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'superfluous')
            };

            fn(app, settings);

            get(app, mount + '/controller', function (err) {
                t.error(err);
                get(app, mount + '/subsuperfluous/subcontroller', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('named', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'named', 'routes')
            };

            fn(app, settings);

            t.ok(typeof app.locals.routes, 'object');
            t.equal(app.locals.enrouten.routes['my-foo'], mount ? mount : '/');
            t.equal(app.locals.enrouten.routes['my-bar'], mount + '/bar');
            t.equal(app.locals.enrouten.routes['my-list'], mount + '/list/stuff');

            get(app, mount + '/', function (err) {
                t.error(err);
                get(app, mount + '/list', function (err) {
                    t.error(err);
                    get(app, mount + '/list/stuff', function (err) {
                        t.error(err);
                        t.end();
                    });
                });
            });
        });


        t.test('duplicate names', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'named', 'duplicates')
            };

            t.throws(function () {
                fn(app, settings);
            });

            t.end();
        });

    });


    test('index', function (t) {

        t.test('module default', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'indexed')
            };

            fn(app, settings);

            get(app, mount + '/good', function (err) {
                t.error(err);
                get(app, mount + '/subgood', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('explicit index file', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'indexed', 'index')
            };

            fn(app, settings);

            get(app, mount + '/good', function (err) {
                t.error(err);

                get(app, mount + '/subgood', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('transpiled from es6', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'transpiled', 'controller')
            };

            fn(app, settings);

            get(app, mount, function (err) {
                t.error(err);
                t.end();
            });
        });


        t.test('missing index file', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'indexed', 'undefined')
            };

            t.throws(function () {
                fn(app, settings);
            });
            t.end();
        });


        t.test('named', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'named', 'routes')
            };

            fn(app, settings);

            t.ok(typeof app.locals.routes, 'object');
            t.equal(app.locals.enrouten.routes['my-foo'], mount ? mount : '/');
            t.equal(app.locals.enrouten.routes['my-bar'], mount + '/bar');
            // t.equal(app.locals.routes['my-list'], mount + '/list');

            get(app, mount + '/', function (err) {
                t.error(err);
                get(app, mount + '/bar', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('duplicate names', function (t) {
            var app, settings;

            app = express();
            settings = {
                index: path.join('fixtures', 'named', 'duplicates')
            };

            t.throws(function () {
                fn(app, settings);
            });

            t.end();
        });

    });


    test('router', function (t) {

        t.test('basic routes', function (t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'get',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    },
                    {
                        path: '/sub',
                        method: 'get',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    }
                ]
            };

            fn(app, settings);

            get(app, mount, function (err) {
                t.error(err);
                get(app, mount + '/sub', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('default to GET', function (t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    },
                    {
                        path: '/sub',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    }
                ]
            };

            fn(app, settings);

            get(app, mount, function (err) {
                t.error(err);
                get(app, mount + '/sub', function (err) {
                    t.error(err);
                    t.end();
                });
            });
        });


        t.test('multiple verbs', function (t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'post',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    },
                    {
                        path: '/sub',
                        method: 'get',
                        handler: function (req, res) {
                            res.send('ok');
                        }
                    }
                ]
            };

            fn(app, settings);

            get(app, mount + '/sub', function (err) {
                t.error(err);
                request(app)
                    .post(mount)
                    .expect('Content-Type', /html/)
                    .expect(200, 'ok', function (err) {
                        t.error(err);
                        t.end();
                    });
            });
        });


        t.test('missing path', function (t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'get'
                    }
                ]
            };

            t.throws(function () {
                fn(app, settings);
            });
            t.end();
        });

        t.test('single middleware', function(t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'get',
                        middleware: [
                            function(req, res, next) {
                                res.value = 'middleware';
                                next();
                            }
                        ],
                        handler: function (req, res) {
                            res.send(res.value);
                        }
                    }
                ]
            };

            fn(app, settings);

            request(app)
                .get(mount)
                .expect('Content-Type', /html/)
                .expect(200, 'middleware', function (err) {
                    t.error(err);
                    t.end();
                });
        });

        t.test('multiple middleware', function(t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'get',
                        middleware: [
                            function(req, res, next) {
                                res.value1 = 1;
                                next();
                            },
                            function(req, res, next) {
                                res.value2 = 2;
                                next();
                            }
                        ],
                        handler: function (req, res) {
                            res.send((res.value1 + res.value2).toString());
                        }
                    }
                ]
            };

            fn(app, settings);

            request(app)
                .get(mount)
                .expect('Content-Type', /html/)
                .expect(200, (3).toString(), function (err) {
                    t.error(err);
                    t.end();
                });
        });

        t.test('error thrown in middleware', function(t) {
            var app, settings;

            app = express();
            settings = {
                routes: [
                    {
                        path: '/',
                        method: 'get',
                        middleware: [
                            function(req, res, next) {
                                next(new Error('middleware error'));
                            },
                            function(req, res, next) {
                                res.msg = 'You wont see this';
                                next();
                            }
                        ],
                        handler: function (req, res) {
                            res.send(res.msg);
                        }
                    }
                ]
            };

            fn(app, settings);

            // error handler
            app.use(function(err, req, res, next) {
                res.status(503).send(err.message);
            });

            request(app)
                .get(mount)
                .expect('Content-Type', /html/)
                .expect(503, 'middleware error', function (err) {
                    t.error(err);
                    t.end();
                });
        });


    });

    test('path generation', function (t) {

        t.test('api', function (t) {
            var app, settings, actual;

            app = express();
            settings = {
                directory: path.join('fixtures', 'named', 'routes')
            };

            // enrouten not yet run
            actual = enrouten.path(app, 'the-bar', { id: 10 });
            t.equal(actual, undefined);

            fn(app, settings);

            actual = enrouten.path(app, 'the-bar', { id: 10 });
            t.equal(actual, mount + '/bar/10');

            actual = enrouten.path(app, 'my-bar');
            t.equal(actual, mount + '/bar');

            actual = enrouten.path(app, 'unknown');
            t.equal(actual, undefined);

            t.end();
        });


        t.test('locals', function (t) {
            var app, settings, actual;

            app = express();
            settings = {
                directory: path.join('fixtures', 'named', 'routes')
            };

            fn(app, settings);

            actual = app.locals.enrouten.path('the-bar', { id: 10 });
            t.equal(actual, mount + '/bar/10');

            actual = app.locals.enrouten.path('my-bar');
            t.equal(actual, mount + '/bar');

            actual = app.locals.enrouten.path(app, 'unknown');
            t.equal(actual, undefined);

            t.end();
        });

        t.test()

    });

}
