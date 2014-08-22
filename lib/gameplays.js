module.exports = (function() {
    var Collection = require('easy-collections');
    var gameplays = new Collection(require('./db'), 'gameplays');
    var versions = require('./versions');

    var token = function() {
        return Math.random().toString(36).substr(2);
    };

    gameplays.start = function(playerId, trackingCode) {
        return versions.find({
                trackingCode: trackingCode
            }, true)
            .then(function(version) {
                if (version) {
                    var gameplay = {
                        playerId: playerId,
                        versionId: version._id,
                        lastAccessed: new Date()
                    };
                    return gameplays.insert(gameplay).then(function(gameplay) {
                        // To assure uniqueness in the authtoken, but also randomness
                        var set = {
                            authToken: gameplay._id + token()
                        };
                        return gameplays.findAndModify(gameplay._id, set);
                    });
                }
            });
    };

    gameplays.track = function(authToken) {
        return gameplays.find({
            authToken: authToken
        }, true).then(function(gameplay) {
            if (gameplay) {
                if (this.queue) {
                    // Adds the version to the analysis queue
                    this.queue.enqueue(gameplay.versionId);
                }
                var set = {
                    lastAccessed: new Date()
                };
                return gameplays.findAndModify(gameplay._id, set);
            } else {
                throw {
                    status: 401
                };
            }
        });
    };

    /**
     * Sets the queue with the versions to be analyzed
     */
    gampelays.setAnalysisQueue = function(queue) {
        this.queue = queue;
    };

    return gameplays;
})();