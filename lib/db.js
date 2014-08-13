module.exports = (function() {
    return {
        setDB: function(db) {
            this.db = db;
        },
        collection: function(name) {
            return this.db.collection(name);
        }
    };
})();