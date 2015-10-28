var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;


test.testResourceAvailability = function (test) {
    test.expect(3);
    var gameId;
    restHelper.role('developer', {games: {total: 1, used: 0}})
        .then(function (resource) {
            resource.post('/api/games', {title: 'A game'})
                .then(function (game) {
                    gameId = game._id;
                    test.ok(gameId);
                    return resource.post('/api/games', {title: 'Another game'});
                }).then(function () {
                    test.ok(false, 'Expecting an error');
                }).fail(function (err) {
                    test.strictEqual(err.status, 400);
                    return resource.delete('/api/games/' + gameId);
                }).then(function () {
                    return resource.post('/api/games', {title: 'Game 3'});
                }).then(function (game) {
                    test.strictEqual(game.title, 'Game 3');
                }).fail(function (err) {
                    test.ok(false, err);
                }).then(function () {
                    test.done();
                });
        });
};

