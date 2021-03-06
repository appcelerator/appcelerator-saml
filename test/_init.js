'use strict';
var fs = require('fs'),
    path = require('path');

//Get the default configuration
var default_conf = getConfiguration();
default_conf.port = (Math.random() * 40000 + 1200) | 0;

//require and instantiate Arrow...
var Arrow = require('arrow'),
    server = new Arrow(default_conf);

before(function(next) {
    //Register a couple of routes
    var files = path.join(process.cwd(), 'test/files');
    server.loadRoute(files + '/web/routes/fooMe.js');
    server.loadRoute(files + '/web/routes/youFoo.js');
    //register extra files
    server.start(next);
});

after(function(next) {
    //void...
    next();
});

/**
 * Returns a configuration object, from ./files/default.js
 */
function getConfiguration() {
    var files = path.join(process.cwd(), 'test/files');
    var def_conf = files + '/default.js';
    return require(def_conf);
}

global.Arrow = Arrow;
global.server = server;