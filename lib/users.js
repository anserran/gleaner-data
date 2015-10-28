module.exports = (function () {
    var Resource = require('./resource'),
        Collection = require('easy-collections'),
        crypto = require('crypto'),
        collection = new Collection(require('./db'), 'users'),
        conf = require('./configuration');

    var salt = '';

    var hash = function (password) {
        return crypto.createHash('md5').update(password + salt).digest(
            'hex');
    };

    collection.setFilter(function (user) {
        delete user.password;
    });

    collection.setValidator(function (user, insert) {
        if (insert) {
            var valid = user.name && user.password && user.role && user.role in conf.roles !== -1;
            if (valid) {
                return collection.find({
                    name: user.name
                }, true).then(function (otherUser) {
                    if (otherUser) {
                        return null;
                    } else {
                        user.password = hash(user.password);
                        user.resources = {};
                        if (typeof conf.roles[user.role] === 'object') {
                            for (var resource in conf.roles[user.role]) {
                                user.resources[resource] = {
                                    used: 0,
                                    total: conf.roles[user.role][resource]['create']
                                };
                            }
                        }
                        return user;
                    }
                });
            } else {
                return null;
            }
        } else {
            for (var key in user) {
                if (key === 'name') {
                    delete user.name;
                } else if (key === 'password') {
                    user['password'] = hash(user['password']);
                }
            }
            return user;
        }
    });

    var resource = new Resource('users', collection);
    resource.setSalt = function (s) {
        salt = s;
    };

    resource.login = function (name, password) {
        return collection.find({
            name: name,
            password: hash(password)
        }, true);
    };

    return resource;
})();