#!/bin/env node
//  OpenShift sample Node application
var express = require('express');
var fs = require('fs');
var _ = require('underscore');
var mongodb = require('mongodb');
var mongoose = require('./db').getMongoose();
var MongoStore = require('connect-mongo')(express);

/**
 *  Define the sample application.
 */
var SampleApp = function() {

    //  Scope.
    var self = this;


    // Setup
    var MONGODB_DB_HOST = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
    var MONGODB_DB_PORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;
    var MONGODB_DB_USERNAME = process.env.OPENSHIFT_MONGODB_DB_USERNAME || '';
    var MONGODB_DB_PASSWORD = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '';
    var MONGODB_DB_NAME = "sbsquares";

    self.dbServer = new mongodb.Server(MONGODB_DB_HOST, parseInt(MONGODB_DB_PORT));
    self.db = new mongodb.Db(MONGODB_DB_NAME, self.dbServer, {auto_reconnect: true, w: 1});


    var IP = process.env.OPENSHIFT_INTERNAL_IP || '127.0.0.1';

    var Group = mongoose.model('Group');
    var User = mongoose.model('User');
    var Square = mongoose.model('Square');


    self.ipaddr = IP;
    self.port = parseInt(process.env.OPENSHIFT_INTERNAL_PORT) || 3501;
    if (typeof self.ipaddr === "undefined") {
        console.warn('No OPENSHIFT_INTERNAL_IP environment variable');
    }
    ;

    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
        //  Set the environment variables we need.
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        }
        ;
    };

    self.shuffle = function(o) {
        for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x)
            ;
        return o;
    }
    ;

    /**
     * Check the session for a group id
     **/
    self.checkSession = function(req, res, msg) {
        if (_.isUndefined(req.session.gid)) {
            var body = {success: false, message: msg};
            res.setHeader('Content-Length', body.length);
            res.json(401, body);
        }
    }

    self.groupHasEmptySquares = function(groupId, callback) {
        Square.find({groupId: groupId, name: {"$exists": false}}, function(err, squares) {
            if (err) {
                console.log("Error determing if group has empty squares!");
                callback(false);
            }
            if (squares && squares.length > 0) {
                callback(true);
            } else {
                callback(false);
            }

        });
    }

    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = {'index.html': ''};
        }

        //  Local cache for static content.
        //self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) {
        return self.zcache[key];
    };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating sample app ...',
                    Date(Date.now()), sig);
            process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()));
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function() {
        //  Process on exit and signals.
        process.on('exit', function() {
            self.terminator();
        });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
            'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() {
                self.terminator(element);
            });
        });
    };

    // Logic to open a database connection. We are going to call this outside of app so it is available to all our functions inside.

    // self.connectDb = function(callback) {
    //     console.log("Connecting to db");
    //     self.db.open(function(err, db) {
    //         if (err) {
    //             console.log("Error connecting ");
    //             throw err
    //         };
    //         //console.log("Authenticating with: "+MONGODB_DB_USERNAME+", pword: "+MONGODB_DB_PASSWORD)
    //         // db.authenticate(MONGODB_DB_USERNAME, MONGODB_DB_PASSWORD, {authdb: "admin"}, function(err, res){
    //         //  if(err){ console.log("AUTH error: "+JSON.stringify(err));throw err };
    //         //  if(callback){
    //         //     callback();
    //         //  }
    //         //  });
    //     });
    // };
    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {

        self.routes = {};

        self.routes['/'] = function(req, res) {
            res.setHeader('Content-Type', 'text/html');
            res.send(self.cache_get('index.html'));
        };

        self.routes['login'] = function(req, res) {
            console.log("loggin in");

            Group.findOne({groupId: req.body.groupId, password: req.body.password})
                    .exec(function(err, group) {
                        res.setHeader('Content-Type', 'application/json');
                        var body = {};
                        if (group) {
                            // save session var
                            req.session.gid = req.body.groupId;
                            body.success = true;
                            res.setHeader('Content-Length', body.length);
                            res.json(body);
                        } else {
                            var msg = "Invalid group id / password";
                            // clear session
                            req.session = null;
                            console.log(msg);
                            body.success = false;
                            body.message = msg;
                            res.setHeader('Content-Length', body.length);
                            res.json(500, body);
                        }
                    });
        };
        self.routes['createGroup'] = function(req, res) {
            req.session = {};
            console.log("creating group" + req.body);
            var groupInstance = new Group();


            console.log("groupid: " + req.body.groupId);
            groupInstance.groupId = req.body.groupId;
            groupInstance.password = req.body.password;

            for (var i = 0; i <= 9; i++) {
                for (var j = 0; j <= 9; j++) {
                    var square = new Square();
                    square.x = i;
                    square.y = j;
                    square.groupId = groupInstance.groupId;
                    square.save();
                }
            }
            //console.log("Group instance: " + JSON.stringify(groupInstance));
            // make sure there isn't any other groups with this id before saving
            //console.log(groupInstance);

            Group.findOne({groupId: groupInstance.groupId}).exec(function(err, group) {
                res.setHeader('Content-Type', 'application/json');
                var body = {};
                if (err) {
                    // clear session
                    req.session = null;
                    var msg = "Error searching...";
                    console.log(msg);
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                }
                if (group) {
                    // clear session
                    req.session = null;
                    // this group id exists send error
                    var msg = "Group id already exists... ";
                    console.log(msg);
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                } else {
                    // we can save it
                    // save session var
                    console.log("persisting new group");
                    req.session.gid = req.body.groupId;
                    groupInstance.save(function(err, savedGroup) {
                        if (err) {
                            console.log("error saving group: " + err);
                            body.success = false;
                            body.message = "Error saving group";
                            res.setHeader('Content-Length', body.length);
                            res.json(body);
                        } else {
                            console.log("success saving group: " + JSON.stringify(savedGroup));
                            body.success = true;
                            res.setHeader('Content-Length', body.length);
                            res.json(body);
                        }
                    });

                }

            });
        };

        self.routes['getGroup'] = function(req, res) {
            console.log("Looking for this group id " + req.params.groupId);
            console.log("cookie: " + JSON.stringify(req.session));
            self.checkSession(req, res, "Login before you continue");
            Group.findOne({groupId: req.params.groupId}).exec(function(err, group) {
                if (err) {
                    var msg = "Invalid group id...";
                    console.log(msg);
                    var body = {};
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                } else {
                    console.log("Looking up squares for: " + group.groupId);
                    Square.find({groupId: group.groupId}, function(err, squares) {
                        //console.log("group: " + group);
                        if (err) {
                            console.log("Error querying groups: " + err);
                        }
                        if (!squares) {
                            squares = [];
                        }
                        console.log("adding " + squares.length + "squares to group");
                        retObj = {groupId: group.groupId, cost: group.cost, password: group.password};
                        retObj.squares = [];
                        var squareMap = {};
                        for (var z = 0; z < squares.length; z++) {
                            var square = squares[z];
                            if(!squareMap[square.x]){
                                squareMap[square.x] = {};
                            }
                            squareMap[square.x][square.y] = {x: square.x, y: square.y, name: square.name, email: square.email};
                            
                        }
                        for(var i = 0; i < 10; i++){
                            for(var j = 0; j < 10; j++){
                                retObj.squares.push(squareMap[i][j]);
                            }
                        }

                        console.log("returning groups: " + JSON.stringify(retObj));
                        res.json(retObj);
                    })

                }

            });
        };

        self.routes['saveAdmin'] = function(req, res) {
            // save admin for this 
            if (_.isUndefined(req.session.gid)) {
                var msg = "Login before you continue";
                var body = {success: false, message: msg};
                res.setHeader('Content-Length', body.length);
                res.json(401, body);
            }
            self.checkSession(req, res, "Login before you continue");
            //save password and cost
            Group.findOne({groupId: req.session.gid}).exec(function(err, group) {
                console.log("Saveing cost: " + req.body.cost);
                //console.log("Saveing adminPassword: " + req.body.adminPassword);
                if (!_.isNull(req.body.cost)) {
                    group.cost = req.body.cost;
                }

                //group.adminPassword = req.body.adminPassword;
                group.save();
                res.json({success: true});
            });
        };

        self.routes['generateNumbers'] = function(req, res) {
            console.log("request: " + JSON.stringify(req.query));
            Group.findOne({groupId: req.query.groupId}).exec(function(err, group) {
                if (group == null) {
                    var msg = "Invalid group id...";
                    console.log(msg);
                    var body = {};
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                }
                if (req.query.password === group.adminPassword) {
                    var xNumbers = [];
                    var yNumbers = [];
                    for (var i = 0; i <= 9; i++) {
                        xNumbers.push(i);
                        yNumbers.push(i);
                    }
                    var shuffledX = self.shuffle(xNumbers);
                    var shuffledY = self.shuffle(yNumbers);

                    group.xNumbers = shuffledX;
                    group.yNumbers = shuffledY;
                    group.save();
                    res.json(group);
                } else {
                    var msg = "Invalid password...";
                    console.log(msg);
                    var body = {};
                    body.success = false;
                    body.message = msg;
                    res.setHeader('Content-Length', body.length);
                    res.json(500, body);
                }

            });
        };

        self.routes['updateSquare'] = function(req, res) {
            self.checkSession(req, res, "Login before you continue");
            console.log(JSON.stringify(req.body));
            Square.find({x: req.body.x, y: req.body.y, groupId: req.body.groupId}, function(err, squares) {
                for (var i = 0; i < squares.length; i++) {
                    var square = squares[i];
                    square.name = req.body.name;
                    square.email = req.body.email;
                    square.save();
                }
                res.json({"success": true});
            });
//            self.db.collection('groups').find({"squares._id": req.body["_id"]},
//            {'squares.$': 1},
//            {w: 1},
//            function(err, results) {
//                if (results && results.length !== 0) {
//                    // this square doesn't have an owner update it now
//                    self.db.collection('groups').update({"squares._id": req.body["_id"]},
//                    {$set: {'squares.$.owner.0': {"name": req.body["name"], "email": req.body["email"]}}},
//                    {w: 1},
//                    function(err, results) {
//                        if (err) {
//                            console.log("Error updating squares", err);
//                        }
//                    });
//                    res.json({"success": true});
//                } else {
//                    res.json(404, {"success": false, "message": "Square already taken"});
//                }
//
//            });


        };

        self.routes['removeOwner'] = function(req, res) {
            self.checkSession(req, res, "Login before you can remove owner");
            console.log(JSON.stringify(req.body));
            self.db.collection('groups').update({"squares._id": req.body["_id"]},
            {$set: {'squares.$.owner.0': {}}},
            {w: 1},
            function(err, results) {
                if (err) {
                    console.log("Error removing owner", err);
                } else {
                    res.json({"success": true});
                }
            }
            );
        };

        self.routes['updateGroup'] = function(req, res) {
            self.checkSession(req, res, "Login before you continue");
            delete req.body["_id"];
            console.log("updating " + req.session.gid + " with this: " + JSON.stringify(req.body));

            self.db.collection('groups').update({groupId: req.body.groupId}, req.body, {w: 1}, function(err, results) {
                console.log("callback from group update: " + JSON.stringify(err));
                if (err) {
                    throw err
                }
                ;
            });



            Group.findOne({groupId: req.session.gid}).exec(function(err, group) {
                if (!_.isNull(group)) {
                    res.json({success: true});
                } else {
                    res.json(500, {success: false, msg: "Couldn't update group!"});
                }
            });
        };
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
        self.app.use(express.session({
            secret: '4265d78bcf30e9f7f9d3963adf982699',
            store: new MongoStore({
                      db: self.db
                    })

        }));
        // routes
        self.app.get('/', self.routes['/']);
        self.app.post('/createGroup', self.routes['createGroup']);
        self.app.post('/login', self.routes['login']);
        self.app.get('/group/:groupId', self.routes['getGroup']);
        self.app.post('/saveAdmin', self.routes['saveAdmin']);
        self.app.post('/updateGroup', self.routes['updateGroup']);
        self.app.get('/generateNumbers', self.routes['generateNumbers']);
        self.app.post('/updateSquare', self.routes['updateSquare']);
        self.app.post('/removeOwner', self.routes['removeOwner']);
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        //self.connectDb();
        self.initializeServer();

    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                    Date(Date.now()), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var zapp = new SampleApp();
zapp.initialize();
zapp.start();
//zapp.connectDb(zapp.start());

