module.exports = function (router, options) {
    options = options || {};
    var apiRoot = options.apiRoot || '/';
    var collectorRoot = options.collectorRoot || '/';

    var collector = require('./collector');
    var games = require('./games');
    var versions = require('./versions');
    var users = require('./users');

    users.setSalt(options.passwordsSalt || '');

    var processResponse = function (promise, res) {
        promise.then(function (result) {
            res.json(result);
        }).fail(function (err) {
            if (err.stack) {
                console.log(err.stack);
            }

            if (err.status) {
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

    // Tracker
    router.post(collectorRoot + 'start/:trackingCode', function (req, res) {
        processResponse(collector.start(req.params.trackingCode, req.headers.authorization), res);
    });

    router.post(collectorRoot + 'track', function (req, res) {
        processResponse(collector.track(req.headers.authorization, req.body), res);
    });

    // GET
    router.get(apiRoot + 'games', read(games));
    router.get(apiRoot + 'games/:gameId/versions', read(versions, function (req, callback) {
        callback({
            gameId: games.toObjectID(req.params.gameId)
        });
    }));
    router.get(apiRoot + 'users', read(users));

    // GET/id
    router.get(apiRoot + 'games/:id', readResource(games));
    router.get(apiRoot + 'games/:gameId/versions/:id', readResource(versions));
    router.get(apiRoot + 'users/:id', readResource(users));


    // POST
    router.post(apiRoot + 'games', create(games));
    router.post(apiRoot + 'games/:gameId/versions', create(versions, function (req, res) {
        req.body.gameId = games.toObjectID(req.params.gameId);
    }));
    router.post(apiRoot + 'users', create(users));

    // DELETE
    router.delete(apiRoot + 'games/:id', deleteById(games));
    router.delete(apiRoot + 'games/:gameId/versions/:id', deleteById(versions));
    router.delete(apiRoot + 'users/:id', deleteById(users));

    // POST/id
    router.post(apiRoot + 'games/:id', update(games));
    router.post(apiRoot + 'games/:gameId/versions/:id', update(versions, function (req, res) {
        if (req.body && req.body.gameId) {
            delete req.body.gameId;
        }
    }));
    router.post(apiRoot + 'users/:id', update(users));

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