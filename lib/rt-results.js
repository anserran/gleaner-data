module.exports = (function() {
    var Collection = require('easy-collections');
    var gameplays = require('./gameplays');

    return {
        find: function(versionId) {
            return gameplays.find({
                versionId: versionId,
                lastAccessed: {
                    $gt: new Date(new Date() - 10 * 60000)
                }
            }).then(function(gameplays) {
                var results = new Collection(require('./db', 'rt_results_' + versionId));
                var ids = [];
                gameplays.forEach(function(gameplay) {
                    ids.push(gameplay._id);
                });
                return results.find({
                    gameplayId: {
                        $in: ids
                    }
                });
            });
        }
    };
})();