var Q = require('q'),
    _ = require('underscore'),
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


var operations = ['create', 'read', 'update', 'delete'];

module.exports = function (name, collection, permissions) {
    for (var i = 0; i < operations.length; i++) {
        if (!permissions[operations[i]]) {
            permissions[operations[i]] = {};
        }
    }

    var subtractResource = function (userId, resource) {
        return users.findById(userId).then(function (user) {
            var resources = user.resources ? user.resources[name] : undefined;
            if (resources) {
                var used = resources.used || 0;
                var total = resources.total || 0;
                if (used < total) {
                    // We send used and total in the where clause to cause an error if the user is accessed concurrently
                    var where = {};
                    where['resources.' + name + '.used'] = used;

                    var set = {};
                    set['resources.' + name + '.used'] = used + 1;

                    return users.findAndModify(user._id, where, set)
                        .then(function (result) {
                            // The resource is inserted only if user was successfully updated
                            if (result) {
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


    return {
        create: function (userId, role, resource) {
            resource.owner = collection.toObjectID(userId);
            var permission = permissions['create'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resource).then(function (result) {
                        if (result) {
                            return subtractResource(userId, resource);
                        } else {
                            throw {status: 401}
                        }
                    });
                } else {
                    return subtractResource(userId, resource);
                }
            } else {
                return error(401);
            }
        },
        read: function (userId, role, readWhere, readOne) {
            var permission = permissions['read'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId).then(function (roleWhere) {
                        return collection.find(_.extend({}, readWhere, roleWhere), readOne);
                    });
                } else {
                    return collection.find(null, readOne);
                }
            } else {
                return error(401);
            }
        },
        readResource: function (userId, role, resourceId) {
            var permission = permissions['update'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resourceId).
                        then(function (result) {
                            if (result) {
                                return collection.findById(resourceId);
                            } else {
                                throw {status: 401}
                            }
                        });
                } else {
                    return collection.findById(resourceId);
                }
            } else {
                return error(401);
            }
        },
        update: function (userId, role, resourceId, resource) {
            var permission = permissions['update'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resourceId).
                        then(function (result) {
                            if (result) {
                                return collection.findAndModify(resourceId, resource);
                            } else {
                                throw {status: 401}
                            }
                        });
                } else {
                    return collection.findAndModify(resourceId, resource);
                }
            } else {
                return error(401);
            }
        },
        delete: function (userId, role, resourceId) {
            var permission = permissions['delete'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resourceId).then(function (result) {
                        if (result) {
                            return recoverResource(userId, resourceId);
                        } else {
                            throw {status: 401}
                        }
                    });
                } else {
                    return recoverResource(userId, resourceId);
                }
            } else {
                return error(401);
            }
        },
        toObjectID: function (id) {
            return collection.toObjectID(id);
        },
        collection: function () {
            return collection;
        }
    }
};
