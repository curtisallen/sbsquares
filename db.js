// DB Schema
var mongoose = require('mongoose');
var _ = require('underscore');
var async = require('async');
var Schema = mongoose.Schema;

// Setup
var MONGODB_DB_HOST = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
var MONGODB_DB_PORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;
var MONGODB_DB_USERNAME = process.env.OPENSHIFT_MONGODB_DB_USERNAME || '';
var MONGODB_DB_PASSWORD = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || '';
var MONGODB_DB_NAME = "sbsquares";


var User = new Schema({
	name : {type: String},
	email: String
});
var Square = new Schema({
   x : Number,
   y : Number,
   name: String,
   email: String,
   groupId: String
});
var Group = new Schema({
	groupId : {type: String, unique: true},
	password: String,
	adminPassword: String,
	users: [User],
	cost: Number,
        xNumbers: [Number],
        yNumbers: [Number]
        
});

mongoose.model('Group', Group);
mongoose.model('User', User);
mongoose.model('Square', Square);
//mongoose.connect('mongodb://' + MONGODB_DB_HOST + '/' + MONGODB_DB_NAME ,{
//	//db  	: MONGODB_DB_NAME,
//	user 	: MONGODB_DB_USERNAME,
//	pass 	: MONGODB_DB_PASSWORD,
//	//server 	: MONGODB_DB_HOST
//});
console.log("Connecting to: "+process.env.OPENSHIFT_MONGODB_DB_URL);
mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL+MONGODB_DB_NAME);

exports.getMongoose = function() {
	return mongoose;
}
