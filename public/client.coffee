client = new Faye.Client "http://192.168.50.152:3000/faye"

sessionId = null
apiKey = null
token = null
session = null

addHandler = (session,type,callback) ->
	console.log "addHandler"
	session.addEventListener type, callback
	
subscribeToStreams = (streams) ->
	for stream in streams
		session.subscribe stream if stream.connection.connectionId != session.connection.connectionId 
		

setupSession = (session) ->
	console.log "setupSession #{session}"
	addHandler session, "sessionConnected", (event) -> 
		console.log "sessionConnected"
		subscribeToStreams event.streams
		session.publish()
		
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
	
	

client.subscribe "/yourface", (message) ->
	console.log "faye message -> #{JSON.stringify message}"
	sessionId = message.sessionId
	apiKey = message.apiKey
	token = message.token
	connectOpenTok()