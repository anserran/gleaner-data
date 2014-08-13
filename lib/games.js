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

    var games = new Collection(db, 'games');
    var versions = new Collection(db, 'versions');

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
        processResponse(games.findAndModify(req.params.gameId, req.body), res);
    });

    router.delete(apiRoot + 'games/:gameId', function(req, res) {
        processResponse(games.removeById(req.params.gameId), res);
    });

    router.get(apiRoot + 'games/:gameId/versions', function(req, res) {
        processResponse(versions.find({
            gameId: req.params.gameId
        }), res);
    });

    router.get(apiRoot + 'games/:gameId/versions/:versionId', function(req, res) {
        processResponse(versions.find({
            gameId: req.params.gameId,
            versionId: req.params.versionId
        }), res);
    });
};