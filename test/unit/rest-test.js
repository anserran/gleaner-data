var Collection = require('easy-collections');
var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;


test.testRestGet = function (test) {
    test.expect(2);
    restHelper.role('admin')
        .then(function (resource) {
            resource.get('/api/players/assessments/89ij234jasf')
                .then(function (assessments) {
                    test.ok(true);
                }).fail(function (err) {
                    test.strictEqual(404, err.status);
                    return new Collection(require('../../lib/db'), 'players_assessments_agame').insert({}).then(function () {
                        return resource.get('/api/players/assessments/agame');
                    });
                }).then(function (assessments) {
                    test.strictEqual(1, assessments.length);
                }).fail(function (err) {
                    console.log(err);
                }).then(function () {
                    test.done();
                });
        });
};

