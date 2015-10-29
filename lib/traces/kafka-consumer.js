module.exports = function (conf) {
    var Q = require('q'),
        kafka = require('kafka-node'),
        HighLevelProducer = kafka.HighLevelProducer,
        KeyedMessage = kafka.KeyedMessage,
        producer = new HighLevelProducer(kafka.Client(conf.zookeeper.host + ':' + conf.zookeeper.port));

    producer.on('ready', function () {
        console.log('Kafka producer ready');
        producer.createTopics([conf.topic], false, function (err) {
            if (err) {
                console.log(err);
            }
        });
    });

    producer.on('error', function (err) {
        console.log('Error connecting to kafka: ' + err);
    });


    return {
        addTraces: function (playerId, gameId, gameplayId, data) {
            var deferred = Q.defer();
            producer.send([{
                topic: conf.topic,
                messages: new KeyedMessage(gameplayId.toString(), data)
            }], function (err, data) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(data);
                }
            });
            return deferred.promise;
        },
        close: function () {
            var deferred = Q.defer();
            producer.close(function () {
                deferred.resolve();
            });
            return deferred.promise;
        }
    };
}