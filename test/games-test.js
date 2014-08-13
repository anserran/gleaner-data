var request = require('supertest'),
    express = require('express'),
    bodyParser = require('body-parser');


var req;
var app;

var MongoClient = require('mongodb').MongoClient;
var db;

var rest = require('../lib/rest');
var idCreated;
var versionCreated;
var first = true;

module.exports = {
    setUp: function(callback) {
        MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, database) {
            if (err) {
                console.log(err);
            }
            db = database;
            if (first) {
                db.collection('games').remove(function() {
                    app = express();
                    app.use(bodyParser.json());
                    rest(db, app);
                    callback();
                });
                first = false;
            } else {
                app = express();
                app.use(bodyParser.json());
                rest(db, app);
                callback();
            }
        });
    },
    tearDown: function(callback) {
        db.close();
        callback();
    },
    group1: {
        setUp: function(callback) {
            req = request(app);
            callback();
        },
        tearDown: function(callback) {
            callback();
        },
        postGame: function(test) {
            test.expect(2);
            req.post('/games')
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        test.ok(res.body);
                        idCreated = res.body._id;
                        test.ok(idCreated);
                    }
                    test.done();
                });
        },
        getGames: function(test) {
            test.expect(1);
            req.get('/games')
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log('Games: ' + res.body);
                        test.strictEqual(res.body.length, 1);
                    }
                    test.done();
                });
        },
        getGame: function(test) {
            test.expect(1);
            req.get('/games/' + idCreated)
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log(res.body);
                        test.strictEqual(res.body._id, idCreated);
                    }
                    test.done();
                });
        },
        updateGame: function(test) {
            test.expect(2);
            req.post('/games/' + idCreated)
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .send({
                    title: 'title'
                }).end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log(res.body);
                        test.strictEqual(res.body._id, idCreated);
                        test.strictEqual(res.body.title, 'title');
                    }
                    test.done();
                });
        },
        addVersion: function(test) {
            test.expect(3);
            req.post('/games/' + idCreated + '/versions')
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log(res.body);
                        test.ok(res.body);
                        versionCreated = res.body._id;
                        test.ok(versionCreated);
                        req.get('/games/' + idCreated + '/versions')
                            .expect(200)
                            .set('Accept', 'application/json')
                            .expect('Content-Type', /json/)
                            .end(function(err, res) {
                                if (err) {
                                    test.ok(false, err.stack);
                                } else {
                                    test.strictEqual(res.body.length, 1);
                                }
                                test.done();
                            });
                    }
                });
        },
        versionUpdated: function(test) {
            req.post('/games/' + idCreated + '/versions/' + versionCreated)
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .send({
                    name: 'version'
                }).end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log(res.body);
                        test.strictEqual(res.body._id, versionCreated);
                        test.strictEqual(res.body.name, 'version');
                    }
                    test.done();
                });
        },
        deleteGame: function(test) {
            test.expect(2);
            req.delete('/games/' + idCreated)
                .expect(200)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .end(function(err, res) {
                    if (err) {
                        test.ok(false, err.stack);
                    } else {
                        console.log(res.body);
                        test.ok(res.body);
                        req.get('/games/' + idCreated + '/versions/' + versionCreated)
                            .expect(200)
                            .set('Accept', 'application/json')
                            .end(function(err, res) {
                                if (err) {
                                    test.ok(false, err.stack);
                                } else {
                                    console.log(res.body);
                                    test.ok(!res.body._id);
                                }
                                test.done();
                            });
                    }
                });
        }
    }
};