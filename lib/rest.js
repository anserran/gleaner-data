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


    router.get(apiRoot + 'games', find(games));
    router.get(apiRoot + 'games/:gameId/versions', find(versions, function(req) {
        return {
            gameId: games.toObjectID(req.params.gameId)
        };
    }));

    router.get(apiRoot + 'games/:id', findById(games));
    router.get(apiRoot + 'games/:gameId/versions/:id', findById(versions));
    router.get(apiRoot + 'users/:id', findById(users));

    router.post(apiRoot + 'games', insert(games));
    router.post(apiRoot + 'games/:gameId/versions', insert(versions, function(req, res) {
        req.body.gameId = games.toObjectID(req.params.gameId);
    }));


    router.delete(apiRoot + 'games/:id', deleteById(games));
    router.delete(apiRoot + 'games/:gameId/versions/:id', deleteById(versions));
    router.delete(apiRoot + 'users/:id', deleteById(users));

    router.post(apiRoot + 'games/:gameId', function(req, res) {
        if (req.body && req.body._id) {
            delete req.body._id;
        }
        processResponse(games.findAndModify(req.params.gameId, req.body), res);
    });

    router.post(apiRoot + 'games/:gameId/versions/:versionId', function(req, res) {
        if (req.body) {
            if (req.body._id) {
                delete req.body._id;
            }

            if (req.body.gameId) {
                delete req.body.gameId;
            }
        }
        processResponse(versions.findAndModify(req.params.versionId, req.body), res);
    });


    // Tracker
    router.post(collectorRoot + 'start/:trackingCode', function(req, res) {
        processResponse(collector.start(req.params.trackingCode, req.headers.authorization), res);
    });

    router.post(collectorRoot + 'track', function(req, res) {
        processResponse(collector.track(req.headers.authorization, req.body), res);
    });
};