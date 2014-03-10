'use strict';

var assert = require('assert');
var express = require('express');
var registrar = require('./lib/registry');


var routes = Object.create(null);




var registry = registrar('/foo');

// Vanilla `Router` API
registry.get('/foo', function () {});

// Special API
registry({ path: '/bar', name: 'test' })
    .get(function () {})
    .post(function () {});

registry({ path: '/baz', name: 'foo' })
    .get(function () {});



var registry2 = registrar('/bam', registry);

registry2({ path: '/bark', name: 'bark' })
    .get(function () {});

registry({ path: '/bark', name: 'bark2' })
    .get(function () {});

assert.equal(registry.routes.test, '/foo/bar');
assert.equal(registry.routes.foo, '/foo/baz');
console.log(registry);
console.log(registry2);
