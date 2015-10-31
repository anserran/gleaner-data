var Resource = require('./resource'),
    Collection = require('easy-collections');

var token = function () {
    return Math.random().toString(36).substr(2);
};

var gameModel = {
    name: {
        type: 'string'
    },
    trackingCode: {
        type: 'string'
    },
    enabled: {
        type: 'boolean',
        default: true
    },
    owner: {
        type: 'object',
        class: 'ObjectID'
    }
};

var collection = new Collection(require('./db'), 'games', gameModel);

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

module.exports = new Resource('games', collection);