module.exports = (function() {
    var Collection = require('easy-collections');
    var crypto = require('crypto');
    var users = new Collection(require('./db'), 'users');

    var validRoles = ['admin'];

    users.hash = function(password) {
        return crypto.createHash('md5').update(password + this.salt).digest(
            'hex');
    };

    users.setSalt = function(salt) {
        this.salt = salt;
    };

    users.setFilter(function(user) {
        delete user.password;
    });

    users.setValidator(function(user, insert) {
        if (insert) {
            var valid = user.name && user.password && user.role && validRoles.indexOf(user.role) !== -1;
            if (valid) {
                return users.find({
                    name: user.name
                }, true).then(function(otherUser) {
                    if (otherUser) {
                        return false;
                    } else {
                        user.password = users.hash(user.password);
                        return true;
                    }
                });
            } else {
                return false;
            }
        } else {
            for (var key in user) {
                if (key !== 'password' || key !== 'role') {
                    return false;
                }
            }
            return true;
        }
    });

    users.login = function(name, password) {
        return users.find({
                name: name,
                password: users.hash(password)
            }, true)
            .then(function(userFound) {
                if (userFound) {
                    return true;
                } else {
                    return false;
                }
            });
    };

    return users;
})();