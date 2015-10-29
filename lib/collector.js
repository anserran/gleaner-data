module.exports = (function() {
    var gameplays = require('./gameplays');
    var players = require('./players');
    var traces = require('./traces/traces');

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
            return gameplays.track(authToken).then(function(gameplay) {
                return traces.add(gameplay.playerId, gameplay.gameId, gameplay._id, data);
            });
        }
    };
})();