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

var calculateWhere = function (permissionWhere, user, role) {
    var where = {};
    if (permissionWhere) {
        for (var key in permissionWhere) {
            var value = permissionWhere[key];
            if (value === '$user') {
                value = users.toObjectID(user)
            } else if (value === '$role') {
                value = role;
            }
            where[key] = value;
        }
    }
    return where;
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

    var recoverResource = function (ownerId, resourceId) {
        if (ownerId) {
            return users.findById(ownerId).then(function (owner) {
                var resources = owner && owner.resources ? owner.resources[name] : undefined;
                if (resources) {
                    var used = resources.used || 0;
                    var where = {};
                    where['resources.' + name + '.used'] = used;

                    var set = {};
                    set['resources.' + name + '.used'] = Math.max(0, used - 1);

                    return users.findAndModify(ownerId, where, set)
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
        } else {
            return collection.removeById(resourceId);
        }
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
            } else if (typeof permission === 'object') {
                return collection.find(calculateWhere(permission.where, userId, role), readOne);
            }
            return error(401);
        },
        readResource: function (userId, role, resourceId) {
            var permission = hasPermission(role, 'read');
            if (permission === true) {
                return collection.find({_id: collection.toObjectID(resourceId)}, true);
            } else if (typeof permission === 'object') {
                var where = calculateWhere(permission.where, userId, role);
                where['_id'] = collection.toObjectID(resourceId);
                return collection.find(where, true);
            }
            return error(401);
        },
        update: function (userId, role, resourceId, resource) {
            var permission = hasPermission(role, 'update');
            if (permission === true) {
                return collection.findAndModify(resourceId, resource);
            } else if (typeof permission === 'object') {
                if (permission.exclude) {
                    for (var i = 0; i < permission.exclude.length; i++) {
                        if (resource[permission.exclude[i]]) {
                            return error(400);
                        }
                    }
                }
                return collection.find(calculateWhere(permission.where, userId, role), true)
                    .then(function (result) {
                        if (result && result._id.toString() === resourceId.toString()) {
                            return collection.findAndModify(resourceId, resource);
                        } else {
                            throw {
                                status: 401
                            }
                        }
                    });
            }
            return error(401);
        },
        delete: function (userId, role, resourceId) {
            var permission = hasPermission(role, 'delete');
            if (permission === true) {
                return recoverResource(userId, resourceId);
            } else if (typeof permission === 'object') {
                var where = calculateWhere(permission.where, userId, role);
                where['_id'] = collection.toObjectID(resourceId);
                return collection.find(where, true).then(function (resource) {
                    if (resource) {
                        return recoverResource(resource.owner, resourceId);
                    } else {
                        throw {
                            status: 401
                        }
                    }
                });

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
