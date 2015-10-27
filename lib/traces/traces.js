module.exports = (function () {
    var Q = require('q');
    var authTokens = require('./../auth-tokens');
    // Consumers interested in the incoming traces
    var consumers = [];

    var processTraces = function (playerId, versionId, gameplayId, data, start) {
        if (!data || !data.length) {
            return Q.fcall(function () {
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
            return Q.fcall(function () {
                return data;
            });
        } else {
            return authTokens.newGameplay(playerId, versionId, gameplayId)
                .then(function (gameplayId) {
                    data[i].gameplayId = gameplayId;
                    return processTraces(playerId, versionId, gameplayId, data, i + 1);
                });
        }
    };

    return {
        addConsumer: function (consumer) {
            consumers.push(consumer);
        },
        add: function (playerId, versionId, gameplayId, data) {

            return processTraces(playerId, versionId, gameplayId, data, 0).then(function (data) {
                var promises = [];
                for (var i = 0; i < consumers.length; i++) {
                    promises.push(consumers[i].addTraces(playerId, versionId, gameplayId, data));
                }
                return Q.all(promises).then(function () {
                    return true;
                });
            });
        }
    };
})();