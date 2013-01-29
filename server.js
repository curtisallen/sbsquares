#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs      = require('fs');
var _       = require('underscore');
var mongodb = require('mongodb');
var mongoose = require('./db').getMongoose();

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    // Setup
    var MONGODB_DB_HOST = process.env.OPENSHIFT_MONGODB_DB_HOST || 'localhost';
    var MONGODB_DB_PORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;
    var MONGODB_DB_USERNAME = process.env.OPENSHIFT_MONGODB_DB_USERNAME || '';
    var MONGODB_DB_PASSWORD = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '';
    var IP = process.env.OPENSHIFT_INTERNAL_IP || '127.0.0.1';

    var Group = mongoose.model('Group');
    var User = mongoose.model('User');

    /*self.dbServer = new mongodb.Server(MONGODB_DB_HOST,parseInt(MONGODB_DB_PORT));
    self.db = new mongodb.Db('sbsquares', self.dbServer, {auto_reconnect: true, journal: false});
    self.dbUser = MONGODB_DB_USERNAME;
    self.dbPass = MONGODB_DB_PASSWORD;
    */
    self.ipaddr  = IP;
    self.port    = parseInt(process.env.OPENSHIFT_INTERNAL_PORT) || 3501;
    if (typeof self.ipaddr === "undefined") {
        console.warn('No OPENSHIFT_INTERNAL_IP environment variable');
    };

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
        self.port      = process.env.OPENSHIFT_INTERNAL_PORT || 3501;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_INTERNAL_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        //self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
        self.routes = { };

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html') );
        };

        self.routes['login'] = function(req, res) {
            console.log("loggin in");
            Group.findOne({groupId: req.body.groupId, password: req.body.password})
            .exec(function(err, group) {
                res.setHeader('Content-Type', 'application/json');
                var body = {};
                if(group) {
                    body.success = true;
                    res.setHeader('Content-Length', body.length);
                    res.json(body);
                } else {
                    var msg = "Invalid group id / password";
                    console.log(msg);
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                }
            });
        };
        self.routes['createGroup'] = function(req, res) {
            console.log("creating group" + req.body);
            var groupInstance = new Group();
            groupInstance.groupId = req.body.groupId;
            groupInstance.password = req.body.password;

            // make sure there isn't any other groups with this id before saving
            /*Group.find({groupId: groupInstance.groupId}, function(err, docs) {
                console.log("error" + err);
                console.log("docs " + docs);

            });*/
            console.log(groupInstance);

            Group.findOne({groupId: groupInstance.groupId}).exec(function(err, group) {
                res.setHeader('Content-Type', 'application/json');
                var body = {};
                if (err) {
                    var msg = "Error searching...";
                    console.log(msg);
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                }
                if(group) {
                    // this group id exists send error
                    var msg = "Group id already exists... ";
                    console.log(msg);
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                } else {
                    // we can save it
                    groupInstance.save();
                    body.success = true;
                    res.setHeader('Content-Length', body.length);
                    res.json(body);
                }

            });
        };

        self.routes['getGroup'] = function(req, res) {
            console.log("Looking for this group id " + req.params.groupId);
            Group.findOne({groupId: req.params.groupId}).exec(function(err, group) {
                if(err) {
                    var msg = "Invalid group id...";
                    console.log(msg);
                    var body = {};
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                } else {
                    //console.log("group: " + group);
                    res.json(group);
                }

            });
        };

        self.routes['checkEmail'] = function(req, res) {
            //Group.findOne({groupId})
        }
    };


    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
        self.createRoutes();
        self.app = express();

        //  Add handlers for the app (from the routes).
        // for (var r in self.routes) {
        //     self.app.get(r, self.routes[r]);
        // }
        // server static content 
        self.app.use(express.static(__dirname + '/app'));
        self.app.use(express.static(__dirname + '/components'));
        // conf
        self.app.use(express.bodyParser());
        self.app.use(express.cookieParser());
        self.app.use(express.session({secret: '4265d78bcf30e9f7f9d3963adf982699'}));
        // routes
        self.app.get('/', self.routes['/']);
        self.app.post('/createGroup', self.routes['createGroup']);
        self.app.post('/login', self.routes['login']);
        self.app.get('/group/:groupId', self.routes['getGroup']);
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();

