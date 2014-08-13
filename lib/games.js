module.exports = function(db, router, apiRoot) {

    var processResponse = function(promise, res) {
        promise.then(function(result) {
            res.json(result);
        }).fail(function() {
            res.status(500).end();
        });
    };

    var Collection = require('easy-collections');
    apiRoot = apiRoot || '/';

    var versions = new Collection(db, 'versions');
    var games = new Collection(db, 'games');

    games.preRemove(function(_id, next) {
        versions.remove({
            gameId: _id
        }).then(function() {
            next();
        }).fail(function() {
            next();
        });
    });

    router.post(apiRoot + 'games', function(req, res) {
        processResponse(games.insert(req.body), res);
    });

    router.get(apiRoot + 'games', function(req, res) {
        processResponse(games.find(), res);
    });

    router.get(apiRoot + 'games/:gameId', function(req, res) {
        processResponse(games.findById(req.params.gameId), res);
    });

    router.post(apiRoot + 'games/:gameId', function(req, res) {
        if (req.body && req.body._id) {
            delete req.body._id;
        }
        processResponse(games.findAndModify(req.params.gameId, req.body), res);
    });

    router.delete(apiRoot + 'games/:gameId', function(req, res) {
        processResponse(games.removeById(req.params.gameId), res);
    });

    router.post(apiRoot + 'games/:gameId/versions', function(req, res) {
        req.body.gameId = games.toObjectID(req.params.gameId);
        processResponse(versions.insert(req.body), res);
    });

    router.get(apiRoot + 'games/:gameId/versions', function(req, res) {
        processResponse(versions.find({
            gameId: games.toObjectID(req.params.gameId)
        }), res);
    });

    router.get(apiRoot + 'games/:gameId/versions/:versionId', function(req, res) {
        processResponse(versions.findById(req.params.versionId), res);
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

    router.delete(apiRoot + 'games/:gameId/versions/:versionId', function(req, res) {
        processResponse(versions.removeById(req.params.versionId), res);
    });
};