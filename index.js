module.exports = {
    data: function (db, app, options) {
        options = options || {};

        var conf = require('./lib/configuration');
        conf.roles = options.roles || {};

        require('./lib/db').setDB(db);

        var users = require('./lib/users');
        users.setSalt(options.passwordsSalt || '');
        if (app) {
            require('./lib/rest')(app, options);
        }
        // Configure kafka
        if (options && options.kafka) {
            var traces = require('./lib/traces/traces');
            var kafka = require('./lib/traces/kafka-consumer')(options.kafka);
            traces.addConsumer(kafka);
        }
        return users;
    }
};