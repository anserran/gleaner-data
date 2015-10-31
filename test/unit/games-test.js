var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;

test.testAdmin = function (test) {
    var gameId;
    test.expect(9);
    restHelper.role('admin').then(function (resource) {
        resource.post('/api/games', {name: 'A game'})
            .then(function (result) {
                test.strictEqual(result.name, 'A game');
                gameId = result._id;
                return resource.post('/api/games/' + gameId, {name: 'Other title'});
            }).then(function (result) {
                test.strictEqual(gameId, result._id);
                test.strictEqual(result.name, 'Other title');
                return resource.get('/api/games');
            }).then(function (result) {
                test.strictEqual(result.length, 1);
                test.strictEqual(gameId, result[0]._id);
                test.strictEqual(result[0].name, 'Other title');
                return resource.get('/api/games/' + gameId);
            }).then(function (result) {
                test.strictEqual(result._id, gameId);
                test.ok(result.trackingCode);
                return resource.delete('/api/games/' + gameId)
            }).then(function (result) {
                test.strictEqual(result._id, gameId);
            }).fail(function (err) {
                console.log(err);
                test.ok(false);
            }).then(function () {
                test.done();
            })
    });
};

