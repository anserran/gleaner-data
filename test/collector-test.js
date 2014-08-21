var testHelper = require('./test-helper')();
var test = testHelper.test;
var helper = testHelper.helper();

testHelper.setUp(function(callback) {
    helper.req.post('/games')
        .end(function(err, res) {
            helper.req.post('/games/' + res.body._id + '/versions')
                .send({
                    trackingCode: '000'
                }).end(function(err, res) {
                    console.log(res.body);
                    callback();
                });
        });
});

test.track = function(test) {
    test.expect(3);
    helper.req.post('/start/000')
        .expect(200)
        .set('Accept', 'application/json')
        .set('Authorization', 'a:')
        .expect('Content-Type', /json/)
        .end(function(err, res) {
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
                    .end(function(err, res) {
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

module.exports = test;