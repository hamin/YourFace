(function() {
  var addHandler, apiKey, bulletNum, bullets, client, clientId, connectOpenTok, opponentToken, session, sessionId, setupSession, shoot, subscribeToStreams, token, updateDivPosition;
  sessionId = null;
  apiKey = null;
  token = null;
  opponentToken = null;
  session = null;
  clientId = -1;
  bullets = [];
  bulletNum = 0;
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
  shoot = function(position) {
    var bulletName;
    ++bulletNum;
    bullets.push(bulletNum);
    bulletName = "b" + bulletNum;
    console.log("shoot bitch shoot! bulletName=" + bulletName + " x: " + position.x + " y: " + position.y);
    $("#playingField").append("<div id='" + bulletName + "' class='bullet'></div>");
    $("#" + bulletName).offset({
      left: position.x,
      top: position.y
    });
    return $("#" + bulletName).animate({
      top: position.y - 915
    }, 400, function() {
      var i;
      i = bullets.indexOf(bulletName);
      bullets.splice(i);
      if ($("#" + bulletName).offset().top < 8) {
        return $("#" + bulletName).remove();
      }
    });
  };
  client = new Faye.Client("http://localhost:3000/faye");
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
      var curLeftPos, curTopPos, offset;
      console.log("keyCode " + event.keyCode);
      curLeftPos = $(".me").offset().left;
      curTopPos = $(".me").offset().top;
      offset = 50;
      if (event.keyCode === 37) {
        updateDivPosition("me", curLeftPos - offset);
      }
      if (event.keyCode === 39) {
        updateDivPosition("me", curLeftPos + offset);
      }
      if (event.keyCode === 16) {
        shoot({
          x: curLeftPos + 50,
          y: curTopPos - 15
        });
      }
      return client.publish("/opponentPos", {
        curLeftPos: $(".me").offset().left,
        oppClientId: clientId
      });
    });
  });
}).call(this);
