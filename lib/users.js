module.exports = (function() {
    var Collection = require('easy-collections');
    var crypto = require('crypto');
    var users = new Collection(require('./db'), 'users');

    users.hash = function(password) {
        return crypto.createHash('md5').update(password + this.salt).digest(
            'hex');
    };

    users.add = function(name, password, role) {
        var that = this;
        return this.find({
            name: name
        }, true).then(function(user) {
            if (user) {
                throw {
                    status: 400,
                    message: 'User name already taken.'
                };
            } else {
                var hashedPassword = hash(password);
                return that.insert({
                    name: name,
                    password: hashedPassword,
                    role: role
                }).then(function(user) {
                    delete(user.password);
                    return user;
                });
            }
        });
    };

    users.setSalt = function(salt) {
        this.salt = salt;
    };

    return users;
})();