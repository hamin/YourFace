client = new Faye.Client "http://localhost:3000/faye"

sessionId = null
apiKey = null
token = null
session = null

addHandler = (session,type,callback) ->
	session.addEventListener type, callback
	
subscribeToStreams = (streams) ->
	for stream in streams
		session.subscribe stream if stream.connection.connectionId != session.connection.connectionId 
		

setupSession = (session) ->
	addHandler session, "sessionConnected", (event) -> 
		console.log "sessionConnected"
		subsribeToStreams event.streams
		session.publish()
		
	addHandler session, "streamCreated", (event) -> 
		console.log "streamCreated"
		subsribeToStreams event.streams
	

connectOpenTok = () ->
	session = TB.initSession(sessionId)
	session.connect(apiKey,token)
	
	setupSession session

client.subscribe "/yourface", (message) ->
	console.log "faye message -> #{message}"
	sessionId = message.sessionId
	apiKey = message.apiKey
	token = message.token