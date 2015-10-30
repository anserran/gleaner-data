module.exports = function () {
    var Q = require('q'),
        request = require('supertest'),
        express = require('express'),
        bodyParser = require('body-parser'),
        session = require('express-session'),
        concat = require('concat-stream'),
        MongoClient = require('mongodb').MongoClient,
        rest = require('../lib/rest'),
        db = require('../lib/db');

    var first = true;
    var app;

    var owner = {
        where: {
            owner: '$user'
        }
    };

    var initTest = function (app, callback) {
        rest(app, {
                loginPath: '/login',
                apiRoot: '/api/',
                collectorRoot: '/collect/',
                roles: {
                    admin: true,
                    developer: {
                        games: {
                            create: -1,
                            read: owner,
                            update: owner,
                            delete: owner
                        }
                    },
                    limited: {
                        games: {
                            create: 1,
                            read: owner,
                            update: {
                                where: {
                                    owner: '$user'
                                },
                                exclude: ['owner']
                            },
                            delete: owner
                        }
                    },
                    player: {
                        players: true
                    }
                }
            }
        )
        ;
        callback();
    };

    var Request = function (request) {

        var resolve = function (deferred) {
            return function (err, res) {
                if (res.status > 299) {
                    deferred.reject({status: res.status});
                } else {
                    deferred.resolve(res.body);
                }
            }
        };

        return {
            post: function (path, data, headers) {
                var deferred = Q.defer();
                var req = request.post(path);
                if (headers) {
                    for (var key in headers) {
                        req = req.set(key, headers[key]);
                    }
                }
                req.send(data).end(resolve(deferred));
                return deferred.promise;
            },
            get: function (path) {
                var deferred = Q.defer();
                request.get(path)
                    .end(resolve(deferred));
                return deferred.promise;
            },
            delete: function (path) {
                var deferred = Q.defer();
                request.delete(path)
                    .end(resolve(deferred));
                return deferred.promise;
            }
        }
    };

    return {
        test: {
            setUp: function (callback) {
                MongoClient.connect('mongodb://127.0.0.1:27017/gleaner-data-test', function (err, database) {
                    if (err) {
                        console.log(err);
                    }
                    db.db = database;
                    app = express();
                    var jsonParser = bodyParser.json();
                    app.use('/api/*', jsonParser);
                    app.use('/login', jsonParser);
                    app.use('/collect/*', function (req, res, next) {
                        req.pipe(concat({encoding: 'string'}, function (data) {
                            req.body = data;
                            next();
                        }));
                    });
                    app.use(session({secret: 'secret', resave: false, saveUninitialized: false}));

                    if (first) {
                        database.dropDatabase(function () {
                            initTest(app, callback);
                        });
                        first = false;
                    } else {
                        initTest(app, callback);
                    }
                });
            },
            tearDown: function (callback) {
                db.db.dropDatabase(function () {
                    db.db.close();
                    callback();
                });
            }
        },
        role: function (role) {
            var deferred = Q.defer();
            var user = request.agent(app);
            var credentials = {
                name: role,
                password: role,
                role: role
            };

            var users = require('../lib/users').collection();
            users.insert(credentials)
                .then(function () {
                    user.post('/login')
                        .send({
                            name: role,
                            password: role,
                            role: role
                        }).end(function (err, res) {
                            if (err) {
                                deferred.reject(err);
                            } else {
                                deferred.resolve(new Request(user));
                            }
                        });

                }).fail(function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        request: function () {
            return new Request(request(app));
        },
        trackingCode: function () {
            return this.role('admin').then(function (resource) {
                return resource.post('/api/games', {title: 'Title'}).then(function (game) {
                    return game.trackingCode;
                });
            });
        }
    };
}
;