module.exports = (function () {
    var Q = require('q');
    var Resource = require('./resource');
    var Collection = require('easy-collections');
    var versions = require('./versions');
    var collection = new Collection(require('./db'), 'games');

    collection.sort = {
        _id: -1
    };

    collection.preRemove(function (_id, next) {
        versions.collection().remove({
            gameId: _id
        }).then(function () {
            next();
        }).fail(function () {
            next();
        });
    });

    var ensureOwnership = function (userId, gameId) {
        return collection.find({_id: collection.toObjectID(gameId), owner: collection.toObjectID(userId)}, true);
    };

    var permissions = {
        'create': {
            'admin': true,
            'developer': true
        },
        'read': {
            'admin': true,
            'developer': function (userId) {
                return Q.fcall(function () {
                    return {'owner': userId}
                });
            }
        },
        'update': {
            'admin': true,
            'developer': ensureOwnership
        },
        'delete': {
            'admin': true,
            'developer': ensureOwnership
        }
    };

    return new Resource('games', collection, permissions);
})();