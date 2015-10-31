var Collection = require('easy-collections'),
    db = require('./db'),
    collector = require('./collector'),
    users = require('./users'),
    conf = require('./configuration');

module.exports = function (router, options) {
    var apiRoot = options.apiRoot || '/';
    var collectorRoot = options.collectorRoot || '/';


    var processResponse = function (promise, res) {
        promise.then(function (result) {
            res.json(result);
        }).fail(function (err) {
            if (err.stack) {
                console.log(err.stack);
            }
            if (err.code) {
                switch (err.code) {
                    case 'E_INVALID_DOCUMENT':
                        res.status(400).send('Invalid document');
                        break;
                }
            } else if (err.status) {
                res.status(err.status);
                if (err.message) {
                    res.send(err.message);
                } else {
                    res.end();
                }
            } else {
                res.status(500).end();
            }
        });
    };

    var create = function (resource, pre) {
        return function (req, res) {
            if (pre) {
                pre(req, res);
            }
            processResponse(resource.create(req.session.userId, req.session.role, req.body), res);
        };
    };

    var read = function (resource, createQuery) {
        return function (req, res) {
            var process = function (query) {
                processResponse(resource.read(req.session.userId, req.session.role, query), res);
            };
            if (createQuery) {
                createQuery(req, process);
            } else {
                process({});
            }
        };
    };

    var readResource = function (resource) {
        return function (req, res) {
            processResponse(resource.readResource(req.session.userId, req.session.role, req.params.id), res);
        };
    };

    var update = function (resource, pre) {
        return function (req, res) {
            if (req.body && req.body._id) {
                delete req.body._id;
            }

            if (pre) {
                pre(req, res);
            }

            processResponse(resource.update(req.session.userId, req.session.role, req.params.id, req.body), res);
        };
    };

    var deleteById = function (resource) {
        return function (req, res) {
            processResponse(resource.delete(req.session.userId, req.session.role, req.params.id), res);
        };
    };

    var collections = {};

    var get = function (collectionName) {
        return function (req, res) {
            var name = collectionName;
            if (req.params) {
                for (var param in req.params) {
                    name = name.replace('#{' + param + '}', req.params[param]);
                }
            }

            Collection.exists(db.db, name).then(function (exists) {
                if (exists) {
                    if (!collections[name]) {
                        collections[name] = new Collection(db, name);
                    }
                    processResponse(collections[name].find(), res);
                } else {
                    res.status(404).end();
                }
            });
        }
    };

    // Tracker
    router.post(collectorRoot + 'start/:trackingCode', function (req, res) {
        processResponse(collector.start(req.params.trackingCode, req.headers.authorization), res);
    });

    router.post(collectorRoot + 'track', function (req, res) {
        processResponse(collector.track(req.headers.authorization, req.body), res);
    });

    var resources = ['games', 'users', 'players'];

    for (var i = 0; i < resources.length; i++) {
        var name = resources[i];
        var resource = require('./' + name);
        router.get(apiRoot + name, read(resource));
        router.get(apiRoot + name + '/:id', readResource(resource));
        router.post(apiRoot + name, create(resource));
        router.post(apiRoot + name + '/:id', update(resource));
        router.delete(apiRoot + name + '/:id', deleteById(resource));
    }

    router.get(apiRoot + 'players/assessments/:id', get('players_assessments_#{id}'));

    // Login
    var loginPath = options.loginPath || '/';
    var redirectLogin = options.redirectLogin || '/';
    var logoutPath = options.logoutPath || '/logout';
    router.post(loginPath, function (req, res) {
        if (req.session.role) {
            delete req.session.role;
            delete req.session.userId;
            delete req.session.name;
        }
        var name = req.body.name;
        var password = req.body.password;
        if (name && password) {
            users.login(name, password).then(function (user) {
                if (user) {
                    req.session.userId = user._id;
                    req.session.name = user.name;
                    req.session.role = user.role;
                    res.redirect(redirectLogin);
                } else {
                    res.redirect(loginPath + '?error=true');
                }
            });
        } else {
            res.redirect(loginPath + '?error=true');
        }
    });

    router.get(logoutPath, function (req, res) {
        if (req.session.role) {
            delete req.session.role;
            delete req.session.userId;
            delete req.session.name;
        }
        res.redirect(loginPath + '?loggedOut=true');
    });
};