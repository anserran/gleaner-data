var Q = require('q'),
    _ = require('underscore'),
    conf = require('./configuration'),
    Collection = require('easy-collections'),
    users = new Collection(require('./db'), 'users');

var error = function (status) {
    return Q.fcall(function () {
        throw {status: status};
    });
};

var ok = function () {
    return Q.fcall(function () {
        return true;
    });
};


module.exports = function (name, collection) {


    var subtractResource = function (userId, resource) {
        return users.findById(userId).then(function (user) {
            var resources = user.resources ? user.resources[name] : undefined;
            if (resources) {
                var used = resources.used || 0;
                var total = resources.total || 0;
                if (total === -1 || used < total) {
                    // We send used and total in the where clause to cause an error if the user is accessed concurrently
                    var where = {};
                    where['resources.' + name + '.used'] = used;

                    var set = {};
                    set['resources.' + name + '.used'] = used + 1;
                    return users.findAndModify(user._id, where, set)
                        .then(function (result) {
                            // The resource is inserted only if user was successfully updated
                            if (result) {
                                resource.owner = user._id;
                                return collection.insert(resource);
                            } else {
                                throw {
                                    status: 400
                                }
                            }
                        });
                } else {
                    throw {
                        status: 400
                    }
                }
            } else {
                return collection.insert(resource);
            }
        })
    };

    var recoverResource = function (userId, resourceId) {
        return users.findById(userId).then(function (user) {
            var resources = user && user.resources ? user.resources[name] : undefined;
            if (resources) {
                var used = resources.used || 0;
                var where = {};
                where['resources.' + name + '.used'] = used;

                var set = {};
                set['resources.' + name + '.used'] = Math.max(0, used - 1);

                return users.findAndModify(userId, where, set)
                    .then(function (result) {
                        if (result) {
                            return collection.removeById(resourceId);
                        } else {
                            throw {
                                status: 400
                            }
                        }
                    });
            } else {
                return collection.removeById(resourceId);
            }
        });
    };

    var hasPermission = function (role, operation) {
        var permissions = conf.roles[role];
        if (permissions) {
            if (permissions === true) {
                return true;
            }

            if (permissions[name]) {
                if (permissions[name] === true) {
                    return true;
                }

                return permissions[name][operation];
            }
        }
        return false;
    };

    return {
        create: function (userId, role, resource) {
            var permission = hasPermission(role, 'create');
            if (permission === true || typeof permission === 'number') {
                return subtractResource(userId, resource);
            }
            return error(401);
        },
        read: function (userId, role, readWhere, readOne) {
            var permission = hasPermission(role, 'read');
            if (permission === true) {
                return collection.find(readWhere, readOne);
            } else if (typeof permission === 'string') {
                switch (permission) {
                    case 'owner':
                        readWhere = readWhere || {};
                        readWhere.owner = collection.toObjectID(userId);
                        return collection.find(readWhere, readOne);
                }
            }
            return error(401);
        },
        readResource: function (userId, role, resourceId) {
            var permission = hasPermission(role, 'read');
            if (permission === true) {
                return collection.find({_id: collection.toObjectID(resourceId)}, true);
            } else if (typeof permission === 'string') {
                switch (permission) {
                    case 'owner':
                        return collection.find({
                            _id: collection.toObjectID(resourceId),
                            owner: collection.toObjectID(userId)
                        }, true);
                }

            }
            return error(401);
        },
        update: function (userId, role, resourceId, resource) {
            var permission = hasPermission(role, 'update');
            if (permission === true) {
                return collection.findAndModify(resourceId, resource);
            } else if (typeof permission === 'string') {
                switch (permission) {
                    case 'owner':
                        return collection.findAndModify(resourceId, {owner: collection.toObjectID(userId)}, resource);
                }
            }
            return error(401);
        },
        delete: function (userId, role, resourceId) {
            var permission = hasPermission(role, 'update');
            if (permission === true) {
                return recoverResource(userId, resourceId);
            } else if (typeof permission === 'string') {
                switch (permission) {
                    case 'owner':
                        return collection.find({
                            _id: collection.toObjectID(resourceId),
                            owner: collection.toObjectID(userId)
                        }, true).then(function (resource) {
                            if (resource) {
                                return recoverResource(userId, resourceId);
                            } else {
                                throw {
                                    status: 401
                                }
                            }
                        });
                }

            }
            return error(401);
        },
        toObjectID: function (id) {
            return collection.toObjectID(id);
        },
        collection: function () {
            return collection;
        }
    }
};
