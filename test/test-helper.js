module.exports = function() {
    var request = require('supertest'),
        express = require('express'),
        bodyParser = require('body-parser');


    var app;

    var MongoClient = require('mongodb').MongoClient;
    var db;

    var rest = require('../lib/rest');
    var first = true;

    var helper = {};
    return {
        helper: function() {
            return helper;
        },
        setUp: function(setUpExtra) {
            helper.setUpExtra = setUpExtra;
        },
        tearDown: function(tearDownExtra) {
            helper.tearDownExtra = tearDownExtra;
        },
        test: {
            setUp: function(callback) {
                MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, database) {
                    if (err) {
                        console.log(err);
                    }
                    db = database;
                    if (first) {
                        db.dropDatabase(function() {
                            app = express();
                            app.use(bodyParser.json());
                            rest(db, app);
                            helper.req = request(app);
                            if (helper.setUpExtra) {
                                helper.setUpExtra(callback);
                            } else {
                                callback();
                            }
                        });
                        first = false;
                    } else {
                        app = express();
                        app.use(bodyParser.json());
                        rest(db, app);
                        helper.req = request(app);
                        if (helper.setUpExtra) {
                            helper.setUpExtra(callback);
                        } else {
                            callback();
                        }
                    }
                });
            },
            tearDown: function(callback) {
                db.close();
                if (helper.tearDownExtra) {
                    helper.tearDownExtra(callback);
                } else {
                    callback();
                }
            }
        }
    };
};