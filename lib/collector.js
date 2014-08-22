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
                            .then(function(gameplay) {
                                // Track data for user
                                return {
                                    authToken: gameplay.authToken,
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
                queue.enqueue(gameplay.versionId);
                return traces.add(gameplay.versionId, gameplay._id, data);
            });
        }
    };
})();