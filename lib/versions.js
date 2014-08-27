module.exports = (function() {
    var Collection = require('easy-collections');
    var versions = new Collection(require('./db'), 'versions');
    versions.sort = {
        _id: -1
    };
    return versions;
})();