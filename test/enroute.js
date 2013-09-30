/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    enrouten = require('../index');


describe('express-enrouten', function () {


    before(function () {
        process.chdir(__dirname);
    });


    it('should handle random config settings', function () {

        enrouten({}).withRoutes({});

        enrouten({}).withRoutes({
            directory: null
        });

        enrouten({}).withRoutes({
            index: null
        });

        enrouten({}).withRoutes({
            routes: null
        });

        enrouten({}).withRoutes({
            routes: []
        });

    });


    describe('directory', function () {


        it('should scan a relative path', function () {
            var initialized, shim;

            initialized = false;

            shim = {
                get: function () {
                    initialized = true;
                }
            };

            enrouten(shim).withRoutes({
                directory: path.join('.', 'fixtures', 'flat')
            });

            assert.ok(initialized);
        });


        it('should scan an absolute path', function () {
            var initialized, shim;

            initialized = false;

            shim = {
                get: function () {
                    initialized = true;
                }
            };

            enrouten(shim).withRoutes({
                directory: path.join(process.cwd(), 'fixtures', 'flat')
            });

            assert.ok(initialized);
        });


        it('should throw when scanning an invalid path', function () {
            var error, initialized, shim;

            initialized = false;
            shim = {
                get: function () {
                    initialized = true;
                }
            };

            try {
                enrouten(shim).withRoutes({
                    directory: path.join(process.cwd(), 'fixtures', 'whatthewhat')
                });
            } catch (err) {
                error = err;
            }

            assert.ok(error);
        });


        it('should traverse a nested directory structure', function () {
            var error, initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                directory: path.join(process.cwd(), 'fixtures', 'nested')
            });

            assert.strictEqual(initialized.length, 2);
        });


        it('should ignore files/definitions that don\'t match the published API', function () {
            var error, initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                directory: path.join(process.cwd(), 'fixtures', 'superfluous')
            });

            assert.strictEqual(initialized.length, 2);
        });

    });


    describe('routes', function () {

        it('should handle a route definition', function () {
            var initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                routes: [{
                    path: '/',
                    method: 'GET',
                    handler: function (req, res) {
                        // ...
                    }
                }]
            });

            assert.strictEqual(initialized.length, 1);
        });


        it('should handle multiple route definitions', function () {
            var initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                routes: [
                    {
                        path: '/',
                        method: 'GET',
                        handler: function (req, res) {
                            // ...
                        }
                    },
                    {
                        path: '/foo',
                        method: 'get',
                        handler: function (req, res) {
                            // ...
                        }
                    }
                ]
            });

            assert.strictEqual(initialized.length, 2);
        });


        it('should default the method to `get`', function () {
            var initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                routes: [
                    {
                        path: '/',
                        handler: function (req, res) {
                            // ...
                        }
                    },
                    {
                        path: '/foo',
                        method: 'get',
                        handler: function (req, res) {
                            // ...
                        }
                    }
                ]
            });

            assert.strictEqual(initialized.length, 2);
        });


        it('should handle multiple methods', function () {
            var initialized, shim;

            initialized = [];
            shim = {
                get: function () {
                    initialized.push(initialized.length);
                },
                post: function () {
                    initialized.push(initialized.length);
                }
            };

            enrouten(shim).withRoutes({
                routes: [
                    {
                        path: '/',
                        method: 'post',
                        handler: function (req, res) {
                            // ...
                        }
                    },
                    {
                        path: '/foo',
                        method: 'get',
                        handler: function (req, res) {
                            // ...
                        }
                    }
                ]
            });

            assert.strictEqual(initialized.length, 2);
        });


        it('should error on missing path', function () {
            var shim, error;

            shim = {
                get: function () {
                    // ...
                }
            };

            try {
                enrouten(shim).withRoutes({
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
            var shim, error;

            shim = {
                get: function () {
                    // ...
                }
            };

            try {
                enrouten(shim).withRoutes({
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

        it('should only load the automatic index file', function () {
            var initialized, shim;

            initialized = [];

            shim = {
                get: function (path) {
                    initialized.push(path);
                }
            };

            enrouten(shim).withRoutes({
                index: path.join('.', 'fixtures', 'indexed')
            });

            assert.strictEqual(initialized.length, 2);
            assert.strictEqual(initialized[0], '/good');
            assert.strictEqual(initialized[1], '/subgood');
        });

        it('should only load the automatic explicit index file', function () {
            var initialized, shim;

            initialized = [];

            shim = {
                get: function (path) {
                    initialized.push(path);
                }
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

            shim = {
                get: function (path) {
                    // ...
                }
            };

            try {
                enrouten(shim).withRoutes({
                    index: path.join('.', 'fixtures', 'indexed', 'indx')
                });
            } catch (err) {
                error = err;
            }

            assert.ok(error);
        });

    });

});