module.exports = (function () {
    var Collection = require('easy-collections');
    var games = require('./games');
    var gameplays = new Collection(require('./db'), 'gameplays');

    var token = function () {
        return Math.random().toString(10).substr(10);
    };

    gameplays.newGameplay = function (playerId, versionId, gameplayId) {
        return gameplays.find({
            playerId: playerId,
            gameplayId: gameplayId,
            gameId: versionId
        }, true).then(function (authToken) {
            if (authToken) {
                var gameplays = new Collection(require('./db'), 'gameplays_' + versionId);
                return gameplays.insert({
                    playerId: playerId,
                    sessions: 0,
                    started: new Date()
                }).then(function (gameplay) {
                    return gameplays.findAndModify(authToken._id, {
                        gameplayId: gameplay._id
                    })
                        .then(function () {
                            return gameplay._id;
                        });
                });
            } else {
                return gameplayId;
            }
        });
    };


    gameplays.start = function (playerId, trackingCode) {
        return games.read('', 'admin', {
            trackingCode: trackingCode
        }, true).then(function (game) {
            if (game) {
                return gameplays.insert({
                    gameId: game._id,
                    playerId: playerId,
                    lastAccessed: new Date()
                }).then(function (gameplay) {
                    // To assure uniqueness in the authtoken, but also randomness
                    var authToken = game._id + gameplay._id + token();
                    return gameplays.findAndModify(gameplay._id, {authToken: authToken})
                        .then(function () {
                            return authToken;
                        });
                });
            } else {
                throw {
                    status: 404
                };
            }
        });
    };

    gameplays.track = function (authToken) {
        return gameplays.find({
            authToken: authToken
        }, true).then(function (gameplay) {
            if (gameplay) {
                return gameplays.findAndModify(gameplay._id, {lastAccessed: new Date(), modified: true});
            } else {
                throw {
                    status: 401
                };
            }
        });
    };

    return gameplays;
})();