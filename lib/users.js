module.exports = (function () {
    var Resource = require('./resource');
    var Collection = require('easy-collections');
    var crypto = require('crypto');
    var collection = new Collection(require('./db'), 'users');

    var validRoles = ['admin', 'developer'];
    var salt = '';
    var initialResources = {};

    var hash = function (password) {
        return crypto.createHash('md5').update(password + salt).digest(
            'hex');
    };

    collection.setFilter(function (user) {
        delete user.password;
    });

    collection.setValidator(function (user, insert) {
        if (insert) {
            var valid = user.name && user.password && user.role && validRoles.indexOf(user.role) !== -1;
            if (valid) {
                return collection.find({
                    name: user.name
                }, true).then(function (otherUser) {
                    if (otherUser) {
                        return null;
                    } else {
                        user.password = hash(user.password);
                        user.resources = initialResources[user.role];
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


    var permissions = {
        'create': {
            'admin': true,
            'developer': false
        },
        'read': {
            'admin': true,
            'developer': false
        },
        'update': {
            'admin': true,
            'developer': false
        },
        'delete': {
            'admin': true,
            'developer': false
        }
    };

    var resource = new Resource('users', collection, permissions);
    resource.setSalt = function (s) {
        salt = s;
    };

    resource.login = function (name, password) {
        return collection.find({
            name: name,
            password: hash(password)
        }, true);
    };

    resource.setAvailableResources = function (resources) {
        initialResources = resources;
    };

    return resource;
})();