module.exports = (function() {
    var Collection = require('easy-collections');
    var versionsResults = new Collection(require('./db'), 'versionsresults');

    versionsResults.findById = function(id) {
        return Collection.prototype.find.call(this, {
            versionId: id
        }, true);
    };

    return versionsResults;
})();