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
	name : {type: String, unique: true},
	email: String,
	squares: [String]
});
var Group = new Schema({
	groupId : {type: String, unique: true},
	password: String,
	users: [User]
});

mongoose.model('Group', Group);
mongoose.model('User', User);
mongoose.connect('mongodb://' + MONGODB_DB_HOST + '/' + MONGODB_DB_NAME ,{
	//db  	: MONGODB_DB_NAME,
	user 	: MONGODB_DB_USERNAME,
	pass 	: MONGODB_DB_PASSWORD,
	//server 	: MONGODB_DB_HOST
});

exports.getMongoose = function() {
	return mongoose;
}
