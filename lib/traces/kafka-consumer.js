var Q = require('q');
var kafka = require('kafka-node'),
    HighLevelProducer = kafka.HighLevelProducer,
    KeyedMessage = kafka.KeyedMessage,
    producer = new HighLevelProducer(kafka.Client());

producer.on('ready', function () {
    console.log('Kafka producer ready');
});

producer.on('error', function (err) {
    console.log('Error connecting to kafka: ' + err);
});

var topic = 'traces';

module.exports = {
    setTopic: function (newTopic) {
        topic = newTopic;
    },
    addTraces: function (playerId, versionId, gameplayId, data) {
        var deferred = Q.defer();
        producer.send([{
            topic: topic,
            messages: new KeyedMessage(versionId + '/' + gameplayId, data)
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