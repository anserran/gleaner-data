module.exports = (function () {
    var Q = require('q');
    var Collection = require('easy-collections');
    var sessions = new Collection(require('./db'), 'sessions');
    var games = require('./games');
    var versions = require('./versions');


    // Tasks to execute in the session analysis start
    sessions.startTasks = [];

    // Tasks to execute in the session analysis end
    sessions.endTasks = [];

    /**
     * Returns the active session for gameId:versionId
     */
    sessions.getSession = function (gameId, versionId) {
        return sessions.find({gameId: gameId, versionId: versionId}, true);
    };

    /**
     * Creates a new session for the given gameId:versionId and launches the real time session analyzer for it.
     * @Returns a promise with the session created
     */
    sessions.startSession = function (gameId, versionId) {
        return getGameVersion(gameId, versionId).then(function (result) {
            return sessions.getSession(result.game._id, result.version._id).then(function (session) {
                if (session) {
                    throw {status: 400}
                }

                return sessions.insert({gameId: result.game._id, versionId: result.version._id, start: new Date()})
                    .then(function (session) {
                        return startSessionAnalysis(session._id).then(function () {
                            return session;
                        });
                    });
            });
        });
    };

    /**
     * Ends the session for the given gameId:versionId, if any
     * @Returns a promise with the session stopped
     */
    sessions.endSession = function (gameId, versionId) {
        gameId = sessions.toObjectID(gameId);
        versionId = sessions.toObjectID(versionId);
        return sessions.getSession(gameId, versionId).then(function (session) {
            if (!session) {
                throw {status: 400}
            }

            return sessions.findAndModify(session._id, {end: new Date()})
                .then(function (session) {
                    return endSessionAnalysis(session._id).then(function () {
                        return session;
                    });
                });
        });
    };

    var getGameVersion = function (gameId, versionId) {
        return games.findById(gameId).then(function (game) {
            if (!game) {
                throw {status: 400}
            }
            return versions.findById(versionId).then(function (version) {
                if (!version) {
                    throw {status: 400}
                }
                return {
                    game: game,
                    version: version
                }
            });
        })
    };

    var startSessionAnalysis = function (sessionId) {
        return executeTaks(sessionId, sessions.startTasks);
    };

    var endSessionAnalysis = function (sessionId) {
        return executeTaks(sessionId, sessions.endTasks);
    };

    var executeTaks = function(sessionId, tasks){
        var promises = [];
        for (var i = 0; i < tasks.length; i++){
            promises.push(tasks[i].call(null, sessionId));
        }
        return Q.all(promises);
    };

    return sessions;
})();