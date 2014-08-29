module.exports = (function() {
    var Collection = require('easy-collections');
    var versionsResults = new Collection(require('./db'), 'versionsresults');

    versionsResults.findById = function(id) {
        return Collection.prototype.find.call(this, {
            versionId: versionsResults.toObjectID(id)
        }, true);
    };

    return versionsResults;
})();