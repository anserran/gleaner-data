var Resource = require('./resource'),
    Collection = require('easy-collections'),
    collection = new Collection(require('./db'), 'games');

var token = function () {
    return Math.random().toString(36).substr(2);
};

module.exports = (function () {


    collection.sort = {
        _id: -1
    };

    collection.insert = function (object) {
        return Collection.prototype.insert.call(this, object).then(function (game) {
            return collection.findAndModify(game._id, {
                trackingCode: game._id + token()
            });
        });
    };

    return new Resource('games', collection);
})();