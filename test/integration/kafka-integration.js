/**
 * This test needs a kafka instance running at localhost:9092
 */
var Q = require('q');
var restHelper = require('../rest-helper')();
var test = module.exports = restHelper.test;

var kafka = require('kafka-node'),
    HighLevelConsumer = kafka.HighLevelConsumer,
    Producer = kafka.Producer,
    client = new kafka.Client(),
    producer = new Producer(client);

test.testKafka = function (test) {
    test.expect(3);

    producer.createTopics(['test-traces'], false, function () {
        var consumer = new HighLevelConsumer(client, [{topic: 'test-traces'}], {groupId: 'test-group'});
        var traces = require('../../lib/traces/traces');
        var kafkaConsumer = require('../../lib/traces/kafka-consumer')({
            zookeeper: {
                host: 'localhost',
                port: 2181
            },
            topic: 'test-traces'
        });
        traces.addConsumer(kafkaConsumer);

        var deferred = Q.defer();
        consumer.on('message', function (message) {
            deferred.resolve(message);
        });

        restHelper.trackingCode().then(function (trackingCode) {
            var req = restHelper.request();
            return req.post('/collect/start/' + trackingCode, '')
                .then(function (trackingData) {
                    test.ok(trackingData.authToken);
                    return req.post('/collect/track', 'trace,trace\n', {'Authorization': trackingData.authToken});
                });
        }).then(function () {
            return deferred.promise;
        }).then(function (message) {
            test.ok(message.key);
            test.strictEqual(message.value, 'trace,trace\n');
        }).fail(function (err) {
            test.ok(false, err);
        }).then(function () {
            consumer.removeTopics(['test-traces'], function () {
                consumer.close();
            });
            return kafkaConsumer.close();
        }).then(function () {
            test.done();
        });
    });
};
