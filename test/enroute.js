/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    express = require('express'),
    request = require('supertest'),
    enrouten = require('../index');


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


    function test(name, fn) {

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

                    get(app, '/', next);
                });


                it('should scan an absolute path', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join(process.cwd(), 'fixtures', 'flat')
                    });

                    get(app, '/', next);
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

                    get(app, '/', function (err) {
                        assert.ok(!err);
                        get(app, '/sub', next);
                    });
                });


                it('should ignore files/definitions that don\'t match the published API', function (next) {
                    var app = express();

                    fn(app, {
                        directory: path.join(process.cwd(), 'fixtures', 'superfluous')
                    });

                    get(app, '/', function (err) {
                        assert.ok(!err);
                        get(app, '/sub', next);
                    });
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

                    get(app, '/', next);
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

                    get(app, '/', function (err) {
                        assert.ok(!err);
                        get(app, '/sub', next);
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

                    get(app, '/', function (err) {
                        assert.ok(!err);
                        get(app, '/sub', next);
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


                    get(app, '/sub', function (err) {
                        assert.ok(!err);
                        request(app)
                            .post('/')
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
                                    path: '/',
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

                    get(app, '/good', function (err) {
                        assert.ok(!err);
                        get(app, '/subgood', next);
                    });
                });

                it('should only load the automatic explicit index file', function () {
                    var initialized, shim;

                    initialized = [];
                    shim = express();
                    shim.get = function (path) {
                        initialized.push(path);
                    };

                    enrouten(shim).withRoutes({
                        index: path.join('.', 'fixtures', 'indexed', 'index')
                    });

                    assert.strictEqual(initialized.length, 2);
                    assert.strictEqual(initialized[0], '/good');
                    assert.strictEqual(initialized[1], '/subgood');
                });


                it('should not load missing index file', function () {
                    var error, shim;

                    shim = express();
                    shim.get = function (path) {
                        // ...
                    };

                    try {
                        fn(shim, {
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


    test('new api', function (app, settings) {
        app.use(enrouten(settings));
    });


    test('original api', function (app, settings) {
        enrouten(app).withRoutes(settings);
    });

});