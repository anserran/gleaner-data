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

    var permissions = {
        'create': {
            'admin': true,
            'developer': false
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
            'developer': function (userId, gameId) {
                return collection.findById(gameId).then(function (game) {
                    return game.owner === userId;
                });
            }
        },
        'delete': {
            'admin': true,
            'developer': false
        }
    };

    return new Resource(collection, permissions);
})();