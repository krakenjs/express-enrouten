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
    var server;
    server = request(app)
        .get(route)
        .expect('Content-Type', /html/)
        .expect(200, 'ok', function (err) {
            server.app.close(next.bind(null, err));
        });
}


function run(test, name, mount, fn) {

    test(name + ' mounting', function (t) {
        var app;

        app = express();
        fn(app);

        fn(app, { basedir: path.join(__dirname, 'fixtures') })
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


        t.test('index', function (t) {
            var app, settings;

            app = express();
            settings = {
                directory: path.join('fixtures', 'indexed')
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
                var server;

                t.error(err);
                server = request(app)
                    .post(mount)
                    .expect('Content-Type', /html/)
                    .expect(200, 'ok', function (err) {
                        t.error(err);
                        server.app.close(t.end.bind(t));
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

    });

}
