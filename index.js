module.exports = {
    users: require('./lib/users'),
    sessions: require('./lib/sessions'),
    traces: require('./lib/traces/traces'),
    data: function (db, app, options) {
        require('./lib/db').db.setDB(db);
        if (app){
            require('./lib/rest')(app, options);
        }
    }
};