module.exports = (function() {
    var Collection = require('easy-collections');
    var traces = new Collection(require('./db'), 'traces');
    traces.addTraces = function(gameplayId, data) {
        for (var i = 0; i < data.length; i++) {
            data[i].gameplayId = gameplayId;
        }
        return traces.insert(data).then(function() {
            return true;
        });
    };
    return traces;
})();