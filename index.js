module.exports = {
    data: function (db, app, options) {
        require('./lib/db').setDB(db);
        if (app) {
            require('./lib/rest')(app, options);
        }
    }
};