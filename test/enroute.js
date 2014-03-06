/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path');
var assert = require('chai').assert;
var express = require('express');
var request = require('supertest');
var enrouten = require('../index');


describe('express-enrouten', function () {

    before(function () {
        process.chdir(__dirname);
    });


    function get(app, route, next) {
        request(app)
            .get(route)
            .expect('Content-Type', /html/)
            .expect(200, 'ok', next);
    }


    function noop(req, res, next) {
        next();
    }


    function test(name, fn, route) {

        route = route || '/';

        describe(name, function () {

            it('should handle random config settings', function () {
                var app;

                app = express();
                fn(app, {});

                app = express();
                fn(app, { directory: null });

                app = express();
                fn(app, { index: null });

                app = express();
                fn(app, { routes: null });

                app = express();
                fn(app, { routes: [] });
            });


            describe('directory', function () {

                it('should scan a relative path', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join('.', 'fixtures', 'flat')
                    });

                    get(app, route, next);
                });


                it('should scan an absolute path', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join(process.cwd(), 'fixtures', 'flat')
                    });

                    get(app, route, next);
                });


                it('should throw when scanning an invalid path', function () {
                    var error;

                    try {
                        fn(express(), {
                            directory: path.join(process.cwd(), 'fixtures', 'whatthewhat')
                        });
                    } catch (err) {
                        error = err;
                    }

                    assert.ok(error);
                });


                it('should traverse a nested directory structure', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join(process.cwd(), 'fixtures', 'nested')
                    });

                    get(app, route, function (err) {
                        assert.ok(!err);
                        get(app, route + 'sub', next);
                    });
                });


                it('should ignore files/definitions that don\'t match the published API', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join(process.cwd(), 'fixtures', 'superfluous')
                    });

                    get(app, route, function (err) {
                        assert.ok(!err);
                        get(app, route + 'sub', next);
                    });
                });


                it('should remove itself', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join('.', 'fixtures', 'flat')
                    });

                    assert.equal(app._router.stack.length, 3);
                    next();
                });

            });


            describe('routes', function () {

                it('should handle a route definition', function (next) {
                    var app = express();

                    fn(app, {
                        routes: [{
                            path: '/',
                            method: 'GET',
                            handler: function (req, res) {
                                res.send('ok');
                            }
                        }]
                    });

                    get(app, route, next);
                });


                it('should handle multiple route definitions', function (next) {
                    var app = express();

                    fn(app, {
                        routes: [
                            {
                                path: '/',
                                method: 'GET',
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
                    });

                    get(app, route, function (err) {
                        assert.ok(!err);
                        get(app, route + 'sub', function (err) {
                            assert.ok(!err);

                            // XXX - Only test path without route if other than '/'
                            if (route !== '/') {
                                get(app, '/sub', function (err) {
                                    assert.ok(err);
                                    next();
                                });
                            } else {
                                next();
                            }

                        });
                    });
                });


                it('should default the method to `get`', function (next) {
                    var app = express();

                    fn(app, {
                        routes: [
                            {
                                path: '/',
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
                    });

                    get(app, route, function (err) {
                        assert.ok(!err);
                        get(app, route + 'sub', next);
                    });
                });


                it('should handle multiple methods', function (next) {
                    var app = express();

                    fn(app, {
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
                    });


                    get(app, route + 'sub', function (err) {
                        assert.ok(!err);
                        request(app)
                            .post(route)
                            .expect('Content-Type', /html/)
                            .expect(200, 'ok', next);
                    });
                });


                it('should error on missing path', function () {
                    var error;

                    try {
                        fn(express(), {
                            routes: [
                                {
                                    method: 'get',
                                    handler: function () {
                                        // ...
                                    }
                                }
                            ]
                        });
                    } catch (err) {
                        error = err;
                    }

                    assert.ok(error);
                });


                it('should error on missing handler', function () {
                    var error;

                    try {
                        fn(express(), {
                            routes: [
                                {
                                    path: route,
                                    method: 'get'
                                }
                            ]
                        });
                    } catch (err) {
                        error = err;
                    }

                    assert.ok(error);
                });

            });


            describe('index', function () {

                it('should only load the automatic index file', function (next) {
                    var app = express();

                    fn(app, {
                        index: path.join('.', 'fixtures', 'indexed')
                    });

                    get(app, route + 'good', function (err) {
                        assert.ok(!err);
                        get(app, route + 'subgood', next);
                    });
                });


                it('should only load the automatic explicit index file', function (next) {
                    var initialized, app;

                    initialized = [];
                    app = express();

                    fn(app, {
                        index: path.join('.', 'fixtures', 'indexed', 'index')
                    });

                    get(app, route + 'good', function (err) {
                        assert.ok(!err);
                        get(app, route + 'subgood', next);
                    });
                });


                it('should not load missing index file', function () {
                    var error, app;

                    app = express();

                    try {
                        fn(app, {
                            index: path.join('.', 'fixtures', 'indexed', 'indx')
                        });
                    } catch (err) {
                        error = err;
                    }

                    assert.ok(error);
                });

            });

        });
    }


    test('plain', function plain(app, settings) {
        app.use(enrouten(settings));
    });

    test('route', function route(app, settings) {
        app.use('/foo', enrouten(settings));
    }, '/foo/');

});
