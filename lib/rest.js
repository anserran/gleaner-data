module.exports = function(db, router, apiRoot, collectorRoot, passwordsSalt) {

    var database = require('./db');
    database.setDB(db);


    apiRoot = apiRoot || '/';
    collectorRoot = collectorRoot || '/';

    var versions = require('./versions');
    var games = require('./games');
    var collector = require('./collector');
    var users = require('./users');

    users.setSalt(passwordsSalt || '');

    var processResponse = function(promise, res) {
        promise.then(function(result) {
            res.json(result);
        }).fail(function(err) {
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

    var find = function(collection, createQuery) {
        return function(req, res) {
            var query = {};
            if (createQuery) {
                query = createQuery(req);
            }
            processResponse(collection.find(query), res);
        };
    };

    var findById = function(collection) {
        return function(req, res) {
            processResponse(collection.findById(req.params.id), res);
        };
    };

    var insert = function(collection, pre) {
        return function(req, res) {
            if (pre) {
                pre(req, res);
            }
            processResponse(collection.insert(req.body), res);
        };
    };

    var deleteById = function(collection) {
        return function(req, res) {
            processResponse(collection.removeById(req.params.id), res);
        };
    };

    var findAndModify = function(collection, pre) {
        return function(req, res) {
            if (req.body && req.body._id) {
                delete req.body._id;
            }

            if (pre) {
                pre(req, res);
            }

            processResponse(collection.findAndModify(req.params.id, req.body), res);
        };
    };


    // GET
    router.get(apiRoot + 'games', find(games));
    router.get(apiRoot + 'games/:gameId/versions', find(versions, function(req) {
        return {
            gameId: games.toObjectID(req.params.gameId)
        };
    }));
    router.get(apiRoot + 'users', find(users));

    // GET/id
    router.get(apiRoot + 'games/:id', findById(games));
    router.get(apiRoot + 'games/:gameId/versions/:id', findById(versions));
    router.get(apiRoot + 'users/:id', findById(users));

    // POST
    router.post(apiRoot + 'games', insert(games));
    router.post(apiRoot + 'games/:gameId/versions', insert(versions, function(req, res) {
        req.body.gameId = games.toObjectID(req.params.gameId);
    }));
    router.post(apiRoot + 'users', insert(users));

    // DELETE
    router.delete(apiRoot + 'games/:id', deleteById(games));
    router.delete(apiRoot + 'games/:gameId/versions/:id', deleteById(versions));
    router.delete(apiRoot + 'users/:id', deleteById(users));

    // POST/id
    router.post(apiRoot + 'games/:id', findAndModify(games));
    router.post(apiRoot + 'games/:gameId/versions/:id', findAndModify(versions, function(req, res) {
        if (req.body && req.body.gameId) {
            delete req.body.gameId;
        }
    }));
    router.post(apiRoot + 'users/:id', findAndModify(users));


    // Tracker
    router.post(collectorRoot + 'start/:trackingCode', function(req, res) {
        processResponse(collector.start(req.params.trackingCode, req.headers.authorization), res);
    });

    router.post(collectorRoot + 'track', function(req, res) {
        processResponse(collector.track(req.headers.authorization, req.body), res);
    });
};