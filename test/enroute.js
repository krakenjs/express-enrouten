/*global describe:false, it:false, before:false, after:false*/
'use strict';

var path = require('path'),
    assert = require('chai').assert,
    enrouten = require('../index');


describe('express-enrouten', function () {


    before(function () {
        process.chdir(__dirname);
    });


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

        try {
            enrouten(shim).withRoutes({
                directory: path.join(process.cwd(), 'fixtures', 'nested')
            });
        } catch (err) {
            error = err;
        }

        assert.ok(!error);
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

        try {
            enrouten(shim).withRoutes({
                directory: path.join(process.cwd(), 'fixtures', 'superfluous')
            });
        } catch (err) {
            error = err;
        }

        assert.ok(!error, 'An unexpected error occurred.');
        assert.strictEqual(initialized.length, 2);
    });

});