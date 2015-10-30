var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;

test.testTrack = function (test) {
    test.expect(3);
    restHelper.trackingCode().then(function (trackingCode) {
        var req = restHelper.request();
        return req.post('/collect/start/' + trackingCode, '')
            .then(function (trackingData) {
                test.ok(trackingData.authToken);
                return req.post('/collect/track', 'trace,trace\n', {'Authorization': trackingData.authToken});
            });
    }).then(function () {
        test.ok(true);
    }).then(function () {
        return restHelper.role('player').
            then(function (resource) {
                return resource.get('/api/players').then(function (players) {
                    test.ok(players)
                });
            });
    }).fail(function (err) {
        console.log(err);
        test.ok(false);
    }).then(function () {
        test.done();
    });
};
