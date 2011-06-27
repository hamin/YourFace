sessionId = null
apiKey = null
token = null
opponentToken = null
session = null
clientId = -1
bullets = []
bulletNum = 0
myScore = 0
oppScore = 0
oppHits=0
myHits=0

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


shoot = (position, isOpp) ->
   ++bulletNum
   bullets.push bulletNum
   bulletName = "b#{bulletNum}"
   bulletClass = "bulletBlue"
   bulletClass = "bullet" if isOpp is true
   console.log "shoot bitch shoot! bulletName=#{bulletName} x: #{position.x} y: #{position.y}"
   $("#playingField").append "<div id='#{bulletName}' class='#{bulletClass}'></div>"
      
   $("##{bulletName}").offset left: position.x, top: position.y
   sign = -1
   sign = 1 if isOpp is true
   $("##{bulletName}").animate {top: (position.y + sign*915) }, 400, () ->
     i = bullets.indexOf bulletName
     bullets.splice i

     # If it hits opponent remove the field and do some stuff
     oppTop = $('.opponent').offset().top
     oppLeft = $('.opponent').offset().left
     oppWidth = oppLeft + $('.opponent').width()
     
     meTop = $('.me').offset().top;
     
     if $("##{bulletName}").offset().left in [oppLeft..oppWidth]
       console.log("BOOM!!!!")
       if isOpp == true then (oppScore += 1) else (myScore += 1)
       $('#myScore').html "<h3>#{myScore}</h3>"
       $('#oppScore').html "<h3>#{oppScore}</h3>"
       # add explosion
       explosionClass = "explosionBlue"
       explosionClass = "explosion" if isOpp is true
       $("#playingField").append "<div id='explosion' class='#{explosionClass}'></div>"  
       top = oppTop;
       top = meTop if isOpp is true
       $("#explosion").offset left: oppLeft+50, top: top+50
       setTimeout "$(\"#explosion\").remove()", 250
       # add hit
       
       if isOpp is false
         hitName = "oppHits#{oppHits}"
         $(".opponent").append "<div id='#{hitName}' class='oppHit'></div>"
         $("##{hitName}").offset left: (oppHits%3) * 30 + 6 + $(".opponent").offset().left , top: (Math.floor oppHits/3) * 30 + 20
         ++oppHits;
       else
         hitName = "myHits#{myHits}"
         $(".me").append "<div id='#{hitName}' class='myHit'></div>"
         $("##{hitName}").offset left: (myHits%3) * 30 + 6 + $(".me").offset().left, top: (Math.floor myHits/3) * 30 + 808
         ++myHits;
       
       console.log $("##{hitName}").offset()
       
       alert "Game OVER!!!" if oppHits is 9 or myHits is 9
       
     # If it leaves playing field remove the bullet
     if ( isOpp is true && $("##{bulletName}").offset().top > 800 ) or ( isOpp is false && $("##{bulletName}").offset().top < 8 )
       $("##{bulletName}").remove()

#client = new Faye.Client "http://192.168.201.92:3000/faye"        
client = new Faye.Client "http://localhost:3000/faye"

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

  client.subscribe "/fire", (message) ->
    if message.oppClientId isnt clientId
      shoot {x: message.x, y: message.y}, true    

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
      shoot {x: curLeftPos+50, y: curTopPos-15}, false
      oppY = $('.opponent').offset().top + $('.opponent').height()
      client.publish '/fire', x: curLeftPos+50, y: oppY, oppClientId: clientId
    
    client.publish "/opponentPos", {curLeftPos: $(".me").offset().left, oppClientId: clientId}
