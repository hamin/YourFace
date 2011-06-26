(function() {
  var addHandler, apiKey, client, connectOpenTok, session, sessionId, setupSession, subscribeToStreams, token;
  client = new Faye.Client("http://localhost:3000/faye");
  sessionId = null;
  apiKey = null;
  token = null;
  session = null;
  addHandler = function(session, type, callback) {
    console.log("addHandler");
    return session.addEventListener(type, callback);
  };
  subscribeToStreams = function(streams) {
    var stream, streamProps, _i, _len, _results;
    streamProps = {
      width: 100,
      height: 100,
      subscribeToAudio: false
    };
    _results = [];
    for (_i = 0, _len = streams.length; _i < _len; _i++) {
      stream = streams[_i];
      _results.push(stream.connection.connectionId !== session.connection.connectionId ? session.subscribe(stream, "opponent", streamProps) : void 0);
    }
    return _results;
  };
  setupSession = function(session) {
    console.log("setupSession " + session);
    addHandler(session, "sessionConnected", function(event) {
      var publishProps;
      console.log("sessionConnected");
      subscribeToStreams(event.streams);
      publishProps = {
        width: 100,
        height: 100,
        subscribeToAudio: false
      };
      return session.publish("me", publishProps);
    });
    return addHandler(session, "streamCreated", function(event) {
      console.log("streamCreated");
      return subscribeToStreams(event.streams);
    });
  };
  connectOpenTok = function() {
    console.log("connectOpenTok sessionId=" + sessionId);
    session = TB.initSession(sessionId);
    TB.setLogLevel(4);
    setupSession(session);
    console.log("apiKey = " + apiKey + " token = " + token);
    return session.connect(apiKey, token);
  };
  $(document).ready(function() {
    $("#playingField").append("<div class='opponent'><div id='opponent'></div></div>");
    return $("#playingField").append("<div class='me'><div id='me'></div></div>");
  });
  client = new Faye.Client("http://localhost:3000/faye");
  client.subscribe("/yourface", function(message) {
    console.log("faye message -> " + (JSON.stringify(message)));
    sessionId = message.sessionId;
    apiKey = message.apiKey;
    token = message.token;
    return connectOpenTok();
  });
}).call(this);
