module.exports = (function () {
    var Resource = require('./resource'),
        Collection = require('easy-collections'),
        versions = require('./versions'),
        collection = new Collection(require('./db'), 'games');

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

    return new Resource('games', collection);
})();