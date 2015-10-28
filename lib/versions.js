module.exports = (function () {
    var Resource = require('./resource'),
        Collection = require('easy-collections'),
        _ = require('underscore'),
        collection = new Collection(require('./db'), 'versions');

    collection.sort = {
        _id: -1
    };

    var token = function () {
        return Math.random().toString(36).substr(2);
    };

    collection.setValidator(function (version, insert) {
        if (insert) {
            if (!version.gameId) {
                return false;
            }
            return collection.find({
                gameId: version.gameId
            }).then(function (versions) {
                for (var i = 0; i < versions.length; i++) {
                    version = _.defaults(version, versions[i]);
                }
                delete version._id;
                return version;
            });
        } else {
            return version;
        }
    });

    collection.insert = function (object) {
        return Collection.prototype.insert.call(this, object).then(function (version) {
            var set = {
                trackingCode: version._id + token()
            };
            return collection.findAndModify(version._id, set);
        });
    };

    collection.preRemove(function (_id, next) {
        var db = require('./db');
        var versionId = _id.toString();
        db.collection('gameplays_' + versionId).drop();
        db.collection('gameplaysresults_' + versionId).drop();
        db.collection('rt_results_' + versionId).drop();
        db.collection('segments_' + versionId).drop();
        db.collection('traces_' + versionId).drop();
        var calculatedData = new Collection(db, 'caculated_data');
        calculatedData.remove({
            versionId: _id
        }).then(function () {
            next();
        }).fail(function () {
            next();
        });
    });

    return new Resource('versions', collection);
})();