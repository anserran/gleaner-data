module.exports = (function () {
    var Q = require('q');
    // Consumers interested in the incoming traces
    var consumers = [];

    var processTraces = function (playerId, versionId, gameplayId, data) {
        return Q(data);
    };

    return {
        addConsumer: function (consumer) {
            consumers.push(consumer);
        },
        add: function (playerId, gameId, gameplayId, data) {
            return processTraces(playerId, gameId, gameplayId, data).then(function (data) {
                var promises = [];
                for (var i = 0; i < consumers.length; i++) {
                    promises.push(consumers[i].addTraces(playerId, gameId, gameplayId, data));
                }
                return Q.all(promises).then(function () {
                    return true;
                });
            });
        }
    };
})();