http = require 'http'
faye = require 'faye'

bayeux = new faye.NodeAdapter( mount: '/faye', timeout: 45)

process.on 'uncaughtException', (err) ->
  console.log "Error: #{err}"

# Handle non-Bayeux requests
server = http.createServer (request, response) ->
  response.writeHead 200, {'Content-Type': 'text/plain'}
  response.write 'Hello, non-Bayeux request'
  response.end


#  Server logging
serverLog = {
  incoming: (message, callback) ->
    logWithTimeStamp "CLIENT SUBSCRIBED Client ID: #{message.clientId}" if (message.channel == '/meta/subscribe')
    logWithTimeStamp "DEVICE MESSAGE ON CHANNEL: #{message.channel}" if message.channel.match(/\/devices\/*/)
    return callback(message)
}

(logMessage) ->
  timestampedMessage = "#{Date} | {logMessage}"
  console.log timestampedMessage