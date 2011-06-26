sessionId = null
apiKey = null
token = null
opponentToken = null
session = null
clientId = -1

addHandler = (session,type,callback) ->
	console.log "addHandler"
	session.addEventListener type, callback
	
subscribeToStreams = (streams) ->
	streamProps = width: 100, height: 100, subscribeToAudio: false
	for stream in streams
		session.subscribe stream, "opponent", streamProps if stream.connection.connectionId != session.connection.connectionId 
		

setupSession = (session) ->
	console.log "setupSession #{session}"
	addHandler session, "sessionConnected", (event) -> 
		console.log "sessionConnected"
		subscribeToStreams event.streams
		publishProps = width: 100, height: 100, subscribeToAudio: false
		session.publish("me",publishProps)
		
	addHandler session, "streamCreated", (event) -> 
		console.log "streamCreated"
		subscribeToStreams event.streams
	

connectOpenTok = () ->
	console.log  "connectOpenTok sessionId=#{sessionId}"
	session = TB.initSession(sessionId)
	TB.setLogLevel(4)
	setupSession session
	
	console.log "apiKey = #{apiKey} token = #{token}"
	session.connect(apiKey,token)
	
updateDivPosition = (divName,newPosition) -> 
  newPosition = Math.max 13, newPosition
  newPosition = Math.min 600, newPosition
  
  console.log "newPosition = #{newPosition}"
  $(".#{divName}").offset left: newPosition

shoot = (position) ->
	console.log "shoot bitch shoot!"
	$("#playingField").append "<div class='bullet'></div>"
	$(".bullet").offset left: position.x, top: position.y
	$(".bullet").animate {top: (position.y - 915) }, 400, () ->
	  $(".bullet").remove() if $(".bullet").offset().top is 8

client = new Faye.Client "http://192.168.201.92:3000/faye"	      
#client = new Faye.Client "http://localhost:3000/faye"

client.subscribe "/yourface", (message) ->
  if clientId < 0
  	sessionId = message.sessionId
  	apiKey = message.apiKey
  	token = message.token
  	clientId = message.clientId
  	connectOpenTok()

# creating player divs
$(document).ready () ->
	$("#playingField").append "<div class='opponent'><div id='opponent'></div></div>"
	$("#playingField").append "<div class='me'><div id='me'></div></div>"
	
	client.subscribe "/opponentPos", (message) ->
    if message.oppClientId isnt clientId
      updateDivPosition "opponent", message.curLeftPos
  # Arrow Button Bindings

	$('body').keydown (event) ->
	  console.log "keyCode #{event.keyCode}"
	  curLeftPos = $(".me").offset().left
	  curTopPos = $(".me").offset().top
	
	  offset = 50
	  #left
	  if event.keyCode is 37
	    updateDivPosition "me", curLeftPos - offset
	  # right
	  if event.keyCode is 39 	
      updateDivPosition "me", curLeftPos + offset
    if event.keyCode is 16
      shoot x: curLeftPos, y: curTopPos
    
    client.publish "/opponentPos", {curLeftPos: $(".me").offset().left, oppClientId: clientId}
