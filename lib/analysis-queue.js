module.exports = (function() {
    var redis = require('redis'),
        client = redis.createClient();

    return {
        client: client,
        enqueue: function(versionId) {
            client.zadd('q_realtime', 1.0, versionId);
        }
    };
})();