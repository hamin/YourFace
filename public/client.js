(function() {
  var addHandler, apiKey, bulletNum, bullets, client, clientId, connectOpenTok, opponentToken, session, sessionId, setupSession, shoot, subscribeToStreams, token, updateDivPosition;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
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
  shoot = function(position, isOpp) {
    var bulletClass, bulletName, sign;
    ++bulletNum;
    bullets.push(bulletNum);
    bulletName = "b" + bulletNum;
    bulletClass = "bulletBlue";
    if (isOpp === true) {
      bulletClass = "bullet";
    }
    console.log("shoot bitch shoot! bulletName=" + bulletName + " x: " + position.x + " y: " + position.y);
    $("#playingField").append("<div id='" + bulletName + "' class='" + bulletClass + "'></div>");
    $("#" + bulletName).offset({
      left: position.x,
      top: position.y
    });
    sign = -1;
    if (isOpp === true) {
      sign = 1;
    }
    return $("#" + bulletName).animate({
      top: position.y + sign * 915
    }, 400, function() {
      var explosionClass, i, meTop, oppLeft, oppTop, oppWidth, top, _i, _ref, _results;
      i = bullets.indexOf(bulletName);
      bullets.splice(i);
      oppTop = $('.opponent').offset().top;
      oppLeft = $('.opponent').offset().left;
      oppWidth = oppLeft + $('.opponent').width();
      meTop = $('.me').offset().top;
      if (_ref = $("#" + bulletName).offset().left, __indexOf.call((function() {
        _results = [];
        for (var _i = oppLeft; oppLeft <= oppWidth ? _i <= oppWidth : _i >= oppWidth; oppLeft <= oppWidth ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this, arguments), _ref) >= 0) {
        console.log("BOOM!!!!");
        explosionClass = "explosionBlue";
        if (isOpp === true) {
          explosionClass = "explosion";
        }
        $("#playingField").append("<div id='explosion' class='" + explosionClass + "'></div>");
        top = oppTop;
        if (isOpp === true) {
          top = meTop;
        }
        $("#explosion").offset({
          left: oppLeft + 50,
          top: oppTop + 50
        });
        setTimeout("$(\"#explosion\").remove()", 250);
      }
      if ((isOpp === true && $("#" + bulletName).offset().top > 800) || (isOpp === false && $("#" + bulletName).offset().top < 8)) {
        return $("#" + bulletName).remove();
      }
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
    client.subscribe("/fire", function(message) {
      if (message.oppClientId !== clientId) {
        return shoot({
          x: message.x,
          y: message.y
        }, true);
      }
    });
    return $('body').keydown(function(event) {
      var curLeftPos, curTopPos, offset, oppY;
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
        }, false);
        oppY = $('.opponent').offset().top + $('.opponent').height();
        client.publish('/fire', {
          x: curLeftPos + 50,
          y: oppY,
          oppClientId: clientId
        });
      }
      return client.publish("/opponentPos", {
        curLeftPos: $(".me").offset().left,
        oppClientId: clientId
      });
    });
  });
}).call(this);
