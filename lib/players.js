var Resource = require('./resource'),
    Collection = require('easy-collections'),
    collection = new Collection(require('./db'), 'players');

module.exports = (function () {
    var players = new Resource('players', collection);
    players.findByAuthorization = function (authorization) {
        if (!authorization) {
            // Create anonymous player
            return collection.insert().then(function (player) {
                var set = {
                    name: 'a' + player._id + Math.round(Math.random() * 100000),
                    type: 'anonymous'
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
    return players;
})();