module.exports = (function() {
    var Q = require('q');
    var Collection = require('easy-collections');
    var authTokens = require('./auth-tokens');
    var collections = {};

    var processTraces = function(playerId, versionId, gameplayId, data, start) {
        if (!data || !data.length) {
            return Q.fcall(function() {
                throw {
                    status: 400
                }
            });
        }

        var i = start;
        var stop = false;
        while (i < data.length && !stop) {
            if (data[i].event && data[i].event === 'start') {
                stop = true;
            } else {
                data[i].gameplayId = gameplayId;
                i++;
            }
        }

        if (i === data.length) {
            return Q.fcall(function() {
                return data;
            });
        } else {
            return authTokens.newGameplay(playerId, versionId, gameplayId)
                .then(function(gameplayId) {
                    data[i].gameplayId = gameplayId;
                    return processTraces(playerId, versionId, gameplayId, data, i + 1);
                });
        }
    };

    return {
        add: function(playerId, versionId, gameplayId, data) {
            var traces = collections[versionId];
            if (!traces) {
                traces = new Collection(require('./db'), 'traces_' + versionId);
                collections[versionId] = traces;
            }

            return processTraces(playerId, versionId, gameplayId, data, 0).then(function(data) {
                return traces.insert(data).then(function() {
                    return true;
                });
            });
        }
    };
})();