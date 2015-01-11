module.exports = function() {
    var request = require('supertest'),
        express = require('express'),
        bodyParser = require('body-parser'),
        session = require('express-session');


    var app;

    var MongoClient = require('mongodb').MongoClient;
    var db;

    var rest = require('../lib/rest');
    var first = true;

    var helper = {
        testError: function(test, err){
            if (err) {
                test.ok(false, err.stack);
                test.done();
            }
        }
    };
    var options = {
        redirectLogin: '/logged'
    };
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
                    require('../lib/db').db = database;
                    app = express();
                    app.use(bodyParser.json());
                    app.use(session({
                        secret: 'secret'
                    }));
                    helper.app = app;
                    if (first) {
                        db.dropDatabase(function() {
                            rest(app, options);
                            helper.req = request(app);
                            if (helper.setUpExtra) {
                                helper.setUpExtra(callback);
                            } else {
                                callback();
                            }
                        });
                        first = false;
                    } else {
                        rest(app, options);
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