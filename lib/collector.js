module.exports = (function() {
    var authTokens = require('./auth-tokens');
    var players = require('./players');
    var traces = require('./traces');

    return {
        start: function(trackingCode, authorization) {
            return players.findByAuthorization(authorization)
                .then(function(player) {
                    if (player) {
                        return authTokens.start(player._id, trackingCode)
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
            return authTokens.track(authToken).then(function(authToken) {
                return traces.add(authToken.playerId, authToken.versionId, authToken.gameplayId, data);
            });
        }
    };
})();