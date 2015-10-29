module.exports = (function() {
    var Collection = require('easy-collections');
    var players = new Collection(require('./db'), 'players');

    players.findByAuthorization = function(authorization) {
        if (!authorization) {
            // Create anonymous player
            return players.insert().then(function (player) {
                var set = {
                    name: 'a' + player._id + Math.round(Math.random() * 100000),
                    type: 'anonymous'
                };
                return players.findAndModify(player._id, set);
            });
        } else if (authorization[0] === 'a'){
            return players.find({name: authorization}, true)
                .then(function(player){
                   if (player){
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