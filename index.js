module.exports = {
    data: function (db, app, options) {
        require('./lib/db').setDB(db);
        if (app) {
            require('./lib/rest')(app, options);
        }
        // Configure kafka
        if (options && options.kafka) {
            var traces = require('./lib/traces/traces');
            var kafka = require('./lib/traces/kafka-consumer')(options.kafka);
        }
    }
};