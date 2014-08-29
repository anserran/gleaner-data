module.exports = (function() {
    var Collection = require('easy-collections');
    var versions = require('./versions');
    var authTokens = require('./auth-tokens');

    var token = function() {
        return Math.random().toString(10).substr(2);
    };

    return {
        start: function(playerId, trackingCode) {
            return versions.find({
                    trackingCode: trackingCode
                }, true)
                .then(function(version) {
                    if (version) {
                        var gameplays = new Collection(require('./db'), 'gameplays_' + version._id);
                        var gameplay = {
                            playerId: playerId,
                        };
                        return gameplays.insert(gameplay).then(function(gameplay) {
                            // To assure uniqueness in the authtoken, but also randomness
                            var authToken = version._id + gameplay._id + token();
                            return authTokens.insert({
                                authToken: authToken,
                                gameplayId: gameplay._id,
                                versionId: version._id,
                                lastAccessed: new Date()
                            }).then(function() {
                                return authToken;
                            });
                        });
                    }
                });
        },
        track: function(authToken) {
            return authTokens.find({
                authToken: authToken
            }, true).then(function(authToken) {
                if (authToken) {
                    var set = {
                        lastAccessed: new Date()
                    };
                    return authTokens.findAndModify(authToken._id, set);
                } else {
                    throw {
                        status: 401
                    };
                }
            });
        }
    };
})();