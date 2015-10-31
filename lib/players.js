var Resource = require('./resource'),
    Collection = require('easy-collections'),
    collection = new Collection(require('./db'), 'players');

var players = new Resource('players', collection);

players.findByAuthorization = function (authorization) {
    if (!authorization) {
        // Create anonymous player
        return collection.insert({type: 'anonymous'}).then(function (player) {
            var set = {
                name: 'a' + player._id + Math.round(Math.random() * 100000)
            };
            return collection.findAndModify(player._id, set);
        });
    } else if (authorization[0] === 'a') {
        return collection.find({name: authorization}, true)
            .then(function (player) {
                if (player) {
                    return player;
                } else {
                    throw {
                        status: 401
                    }
                }
            });
    } else {
        throw {
            status: 401
        }
    }
};

players.findByUserId = function (userId) {
    return collection.find({userId: userId}, true).then(function (result) {
        if (!result) {
            return collection.insert({userId: userId, type: 'user'});
        } else {
            return result;
        }
    });
};

module.exports = players;