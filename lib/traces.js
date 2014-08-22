module.exports = (function() {
    var Collection = require('easy-collections');
    var collections = {};

    return {
        add: function(versionId, gameplayId, data) {
            var traces = collections[versionId];
            if (!traces) {
                traces = new Collection(require('./db'), 'traces_' + versionId);
                collections[versionId] = traces;
            }

            for (var i = 0; i < data.length; i++) {
                data[i].gameplayId = gameplayId;
            }

            return traces.insert(data).then(function() {
                return true;
            });
        }
    };
})();