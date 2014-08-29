module.exports = (function() {
    var gameplays = require('./gameplays');
    var players = require('./players');
    var traces = require('./traces');
    var queue = require('./analysis-queue');

    return {
        start: function(trackingCode, authorization) {
            return players.findByAuthorization(authorization)
                .then(function(player) {
                    if (player) {
                        return gameplays.start(player._id, trackingCode)
                            .then(function(authToken) {
                                // Track data for user
                                return {
                                    authToken: authToken,
                                    playerName: player.name
                                };
                            });
                    } else {
                        throw {
                            status: 401
                        };
                    }
                });
        },
        track: function(authToken, data) {
            return gameplays.track(authToken).then(function(authToken) {
                queue.enqueue(authToken.versionId);
                return traces.add(authToken.versionId, authToken.gameplayId, data);
            });
        }
    };
})();