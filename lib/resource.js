var Q = require('q');
var _ = require('underscore');

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

module.exports = function (collection, permissions) {
    for (var i = 0; i < operations.length; i++) {
        if (!permissions[operations[i]]) {
            permissions[operations[i]] = {};
        }
    }

    return {
        create: function (userId, role, resource) {
            var permission = permissions['create'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resource).then(function (result) {
                        if (result) {
                            return collection.insert(resource);
                        } else {
                            throw {status: 401}
                        }
                    });
                } else {
                    return collection.insert(resource);
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
            var permission = permissions['update'][role];
            if (permission) {
                if (typeof permission === 'function') {
                    return permission(userId, resourceId).then(function (result) {
                        if (result) {
                            return collection.removeById(resourceId);
                        } else {
                            throw {status: 401}
                        }
                    });
                } else {
                    return collection.removeById(resourceId);
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
