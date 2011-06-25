(function() {
  var addHandler, apiKey, client, connectOpenTok, session, sessionId, setupSession, subscribeToStreams, token;
  client = new Faye.Client("http://localhost:3000/faye");
  sessionId = null;
  apiKey = null;
  token = null;
  session = null;
  addHandler = function(session, type, callback) {
    return session.addEventListener(type, callback);
  };
  subscribeToStreams = function(streams) {
    var stream, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = streams.length; _i < _len; _i++) {
      stream = streams[_i];
      _results.push(stream.connection.connectionId !== session.connection.connectionId ? session.subscribe(stream) : void 0);
    }
    return _results;
  };
  setupSession = function(session) {
    addHandler(session, "sessionConnected", function(event) {
      console.log("sessionConnected");
      subsribeToStreams(event.streams);
      return session.publish();
    });
    return addHandler(session, "streamCreated", function(event) {
      console.log("streamCreated");
      return subsribeToStreams(event.streams);
    });
  };
  connectOpenTok = function() {
    session = TB.initSession(sessionId);
    session.connect(apiKey, token);
    return setupSession(session);
  };
  client.subscribe("/yourface", function(message) {
    console.log("faye message -> " + message);
    sessionId = message.sessionId;
    apiKey = message.apiKey;
    return token = message.token;
  });
}).call(this);
