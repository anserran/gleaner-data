var testHelper = require('./test-helper')();
var test = testHelper.test;
var helper = testHelper.helper();

var versionId;
var trackingCode;

testHelper.setUp(function (callback) {
    helper.req.post('/games')
        .end(function (err, res) {
            helper.req.post('/games/' + res.body._id + '/versions')
                .end(function (err, res) {
                    console.log(res.body);
                    trackingCode = res.body.trackingCode;
                    versionId = res.body._id;
                    callback();
                });
        });
});

test.track = function (test) {
    test.expect(3);
    helper.req.post('/start/' + trackingCode)
        .expect(200)
        .set('Accept', 'application/json')
        .set('Authorization', 'a:')
        .expect('Content-Type', /json/)
        .end(function (err, res) {
            if (err) {
                test.ok(false, err.stack);
                test.done();
            } else {
                console.log(res.body);
                test.ok(res.body.authToken);
                test.ok(res.body.playerName);
                helper.req.post('/track')
                    .expect(200)
                    .set('Authorization', res.body.authToken)
                    .send([{
                        a: 0
                    }, {
                        b: 0
                    }])
                    .end(function (err, res) {
                        if (err) {
                            test.ok(false, err.stack);
                        } else {
                            console.log(res.body);
                            test.ok(res.body === true);
                        }
                        test.done();
                    });
            }
        });
};

test.startEvent = function (test) {
    var authToken;
    test.expect(4);
    helper.req.post('/start/' + trackingCode)
        .expect(200)
        .set('Accept', 'application/json')
        .set('Authorization', 'a:')
        .expect('Content-Type', /json/)
        .end(function (err, res) {
            if (err) {
                test.ok(false, err.stack);
                test.done();
            } else {
                console.log(res.body);
                test.ok(authToken = res.body.authToken);
                test.ok(res.body.playerName);
                helper.req.post('/track')
                    .expect(200)
                    .set('Authorization', authToken)
                    .send([{
                        event: 'start'
                    }, {
                        event: 'start'
                    }, {
                        event: 'start'
                    }])
                    .end(function (err, res) {
                        if (err) {
                            test.ok(false, err.stack);
                        } else {
                            console.log(res.body);
                            test.ok(res.body === true);
                        }
                        checkGameplays(test, authToken);
                    });
            }
        });
};

var checkGameplays = function (test, authToken) {
    var authTokens = require('../lib/auth-tokens');
    authTokens.find({
        authToken: authToken
    }, true).then(function (authToken) {
        var Collection = require('easy-collections');
        var gameplays = new Collection(require('../lib/db'), 'gameplays_' + authToken.versionId);
        gameplays.find({
            playerId: authToken.playerId
        }).then(function (gameplays) {
            test.strictEqual(4, gameplays.length);
            test.done();
        });
    });
};

test.sessionsCount = function (test) {
    test.expect(1);
    helper.req.post('/start/' + trackingCode)
        .set('Authorization', 'a:')
        .end(function (err, res) {
            var name = res.body.playerName;
            if (err) {
                test.ok(false, err.stack);
            } else {
                helper.req.post('/start/' + trackingCode)
                    .set('Authorization', 'a:' + name)
                    .end(function (err, res) {
                        var authToken = res.body.authToken;
                        var authTokens = require('../lib/auth-tokens');
                        authTokens.find({
                            authToken: authToken
                        }, true).then(function (authToken) {
                            var Collection = require('easy-collections');
                            var gameplays = new Collection(require('../lib/db'), 'gameplays_' + authToken.versionId);
                            gameplays.find({
                                playerId: authToken.playerId
                            }, true).then(function (gameplay) {
                                test.strictEqual(2, gameplay.sessions);
                                test.done();
                            });
                        });
                    });
            }
        });
};


module.exports = test;