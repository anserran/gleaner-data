var restHelper = require('./rest-helper')();
var test = module.exports = restHelper.test;

test.testTrack = function (test) {
    test.expect(2);
    restHelper.trackingCode().then(function (trackingCode) {
        var req = restHelper.request();
        return req.post('/collect/start/' + trackingCode, '', {'Authorization': 'a:'})
            .then(function (trackingData) {
                test.ok(trackingData.authToken);
                return req.post('/collect/track', 'trace,trace\n', {'Authorization': trackingData.authToken});
            });
    }).then(function () {
        test.ok(true);
    }).fail(function (err) {
        test.ok(false, err);
    }).then(function () {
        test.done();
    });
};
