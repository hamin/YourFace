sessionId = null
apiKey = null
token = null
session = null

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

# creating player divs
$(document).ready () ->
	$("#playingField").append "<div class='opponent'><div id='opponent'></div></div>"
	$("#playingField").append "<div class='me'><div id='me'></div></div>"
	
	$('body').keydown (event) ->
	  curLeftPos = $(".me").offset().left
	  curTopPos = $(".me").offset().left
	  
	  offset = 50;
	  #left
	  if event.keyCode is 37
	  		$(".me").offset left: Math.max 13, curLeftPos - offset
	  # right
	  if event.keyCode is 39 	
      		$(".me").offset left: Math.min 600, curLeftPos + offset
	  # spacebar

	    # when 38
	    #   # top
	    #   $(".me").offset top: (curTopPos - 10)
	    # when 40
	    #   # bottom
	    #   $(".me").offset top: (curTopPos + 10)
	    #   

client = new Faye.Client "http://192.168.50.152:3000/faye"	      
#client = new Faye.Client "http://localhost:3000/faye"

client.subscribe "/yourface", (message) ->
	console.log "faye message -> #{JSON.stringify message}"
	sessionId = message.sessionId
	apiKey = message.apiKey
	token = message.token
	connectOpenTok()

