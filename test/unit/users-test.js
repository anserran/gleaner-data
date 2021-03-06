var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;

test.testAdmin = function (test) {
    var userId;
    test.expect(11);
    restHelper.role('admin').then(function (resource) {
        resource.post('/api/users', {name: 'dev', password: 'developer', role: 'developer'})
            .then(function (result) {
                test.strictEqual(result.name, 'dev');
                test.strictEqual(result.role, 'developer');
                userId = result._id;
                return resource.post('/api/users/' + userId, {role: 'admin'});
            }).then(function (result) {
                test.strictEqual(userId, result._id);
                test.strictEqual(result.role, 'admin');
                return resource.get('/api/users');
            }).then(function (result) {
                test.strictEqual(result.length, 2);
                test.strictEqual(userId, result[1]._id);
                test.strictEqual(result[1].name, 'dev');
                test.strictEqual(result[1].role, 'admin');
                return resource.get('/api/users/' + userId);
            }).then(function (result) {
                test.strictEqual(result._id, userId);
                return resource.delete('/api/users/' + userId)
            }).then(function (result) {
                test.strictEqual(result._id, userId);
                test.strictEqual(result.password, undefined);
            }).fail(function (err) {
                test.ok(false, err);
            }).then(function () {
                test.done();
            })
    });
};

test.testDeveloper = function (test) {
    test.expect(2);
    restHelper.role('developer').then(function (resource) {
        resource.post('/api/users', {name: 'fail', password: 'fail', role: 'admin'})
            .then(function () {
                test.ok(false, 'Developers cannot create users');
            }).fail(function (err) {
                test.strictEqual(err.status, 401);
                return resource.get('/api/users');
            }).fail(function (err) {
                test.strictEqual(err.status, 401);
            }).then(function () {
                test.done();
            });
    });
};

test.testChangePassword = function (test) {
    test.expect(6);

    restHelper.role('admin').then(function (r) {
        var adminId = r.user._id;
        restHelper.role('change').then(function (resource) {
            var id = resource.user._id;
            return resource.post('/api/users/' + adminId, {nickname: 'Ñor'})
                .fail(function (err) {
                    test.strictEqual(err.status, 401);
                    return resource.post('/api/users/' + id, {nickname: 'Bob'});
                }).then(function (result) {
                    test.strictEqual(result._id, id.toString());
                    test.strictEqual(result.nickname, 'Bob');
                    return resource.post('/api/users/' + id, {password: 'newpassword'});
                }).fail(function (err) {
                    test.strictEqual(err.status, 400);
                    return resource.post('/api/users/' + id, {password: ''});
                }).fail(function (err) {
                    test.strictEqual(err.status, 400);
                    return resource.post('/api/users/' + id, {password: 'newpassword', oldPassword: 'change'});
                }).then(function (result) {
                    test.ok(result);
                });
        }).fail(function (err) {
            console.log(err);
        }).then(function () {
            test.done();
        });
    });
};