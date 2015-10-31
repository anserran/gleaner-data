var Resource = require('./resource'),
    Collection = require('easy-collections'),
    crypto = require('crypto'),
    conf = require('./configuration');


var salt = '';

var resourcesModel = {};
for (var role in conf.roles) {
    for (var resourceType in conf.roles[role]) {
        if (!(resourceType in resourcesModel)) {
            resourcesModel[resourceType] = {
                type: 'object',
                model: {
                    used: {
                        type: 'number'
                    },
                    total: {
                        type: 'number'
                    }
                }
            }
        }
    }
}

var userModel = {
    name: {
        type: 'string',
        required: true
    },
    password: {
        type: 'string',
        required: true
    },
    role: {
        type: 'string',
        required: true
    },
    nickname: {
        type: 'string'
    },
    avatar: {
        type: 'string'
    },
    resources: {
        type: 'object',
        model: resourcesModel
    }
};

var collection = new Collection(require('./db'), 'users', userModel);

var hash = function (password) {
    return crypto.createHash('md5').update(password + salt).digest(
        'hex');
};

collection.setFilter(function (user) {
    delete user.password;
    return user;
});

collection.setInsertValidator(function (user) {
    var valid = user.name && user.password && user.role && user.role in conf.roles;
    if (valid) {
        return collection.find({
            name: user.name
        }, true).then(function (otherUser) {
            if (otherUser) {
                return false;
            } else {
                user.password = hash(user.password);
                user.resources = {};
                if (typeof conf.roles[user.role] === 'object') {
                    for (var resource in conf.roles[user.role]) {
                        user.resources[resource] = {
                            used: 0,
                            total: conf.roles[user.role][resource]['create'] || 0
                        };
                    }
                }
                return user;
            }
        });
    } else {
        return null;
    }
});

collection.setUpdateValidator(function (user, id) {
    // Name cannot be modified
    if (user.name) {
        delete user.name;
    }

    // Password can be modified only if old password is sent
    if (user.password) {
        if (!user.oldPassword) {
            return false;
        } else {
            return collection.find({
                _id: id,
                password: hash(user.oldPassword)
            }, true).then(function (result) {
                if (result) {
                    delete user.oldPassword;
                    return user;
                } else {
                    return false;
                }
            });
        }
    }
    return user;
});

var users = new Resource('users', collection);

users.setSalt = function (s) {
    salt = s;
};

users.login = function (name, password) {
    return collection.find({
        name: name,
        password: hash(password)
    }, true);
};

module.exports = users;