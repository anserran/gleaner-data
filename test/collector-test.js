var request = require('supertest'),
    express = require('express'),
    bodyParser = require('body-parser');


var req;
var app;

var MongoClient = require('mongodb').MongoClient;
var db;

var rest = require('../lib/rest');

var addVersion = function(callback) {
    req.post('/games')
        .end(function(err, res) {
            req.post('/games/' + res.body._id + '/versions')
                .send({
                    trackingCode: '000'
                }).end(function(err, res) {
                    console.log(res.body);
                    callback();
                });
        });
};

module.exports = {
    setUp: function(callback) {
        MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, database) {
            if (err) {
                console.log(err);
            }
            db = database;
            db.collection('games').remove(function() {
                app = express();
                app.use(bodyParser.json());
                rest(db, app);
                req = request(app);
                addVersion(callback);
            });
        });
    },
    tearDown: function(callback) {
        db.close();
        callback();
    },
    track: function(test) {
        test.expect(3);
        req.post('/start/000')
            .expect(200)
            .set('Accept', 'application/json')
            .set('Authorization', 'a:')
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) {
                    test.ok(false, err.stack);
                    test.done();
                } else {
                    console.log(res.body);
                    test.ok(res.body.authToken);
                    test.ok(res.body.playerName);
                    req.post('/track')
                        .expect(200)
                        .set('Authorization', res.body.authToken)
                        .send([{
                            a: 0
                        }, {
                            b: 0
                        }])
                        .end(function(err, res) {
                            if (err) {
                                test.ok(false, err.stack);
                            } else {
                                console.log(res.body);
                                test.ok(res.body === true);
                            }
                            test.done();
                        });
                }
            });
    }
};