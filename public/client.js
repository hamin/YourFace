(function() {
  var addHandler, apiKey, client, clientId, connectOpenTok, opponentToken, session, sessionId, setupSession, subscribeToStreams, token, updateDivPosition;
  sessionId = null;
  apiKey = null;
  token = null;
  opponentToken = null;
  session = null;
  clientId = -1;
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
  updateDivPosition = function(divName, newPosition) {
    newPosition = Math.max(13, newPosition);
    newPosition = Math.min(600, newPosition);
    console.log("newPosition = " + newPosition);
    return $("." + divName).offset({
      left: newPosition
    });
  };
  client = new Faye.Client("http://192.168.201.92:3000/faye");
  client.subscribe("/yourface", function(message) {
    if (clientId < 0) {
      sessionId = message.sessionId;
      apiKey = message.apiKey;
      token = message.token;
      clientId = message.clientId;
      return connectOpenTok();
    }
  });
  $(document).ready(function() {
    $("#playingField").append("<div class='opponent'><div id='opponent'></div></div>");
    $("#playingField").append("<div class='me'><div id='me'></div></div>");
    client.subscribe("/opponentPos", function(message) {
      if (message.oppClientId !== clientId) {
        return updateDivPosition("opponent", message.curLeftPos);
      }
    });
    return $('body').keydown(function(event) {
      var curLeftPos, offset;
      curLeftPos = $(".me").offset().left;
      offset = 50;
      if (event.keyCode === 37) {
        updateDivPosition("me", curLeftPos - offset);
      }
      if (event.keyCode === 39) {
        updateDivPosition("me", curLeftPos + offset);
      }
      return client.publish("/opponentPos", {
        curLeftPos: $(".me").offset().left,
        oppClientId: clientId
      });
    });
  });
}).call(this);
