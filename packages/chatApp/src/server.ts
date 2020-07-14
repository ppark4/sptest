import geckos, { Data, RawMessage, iceServers, GeckosServer } from '@geckos.io/server'

// using with express
import express from 'express'
import http from 'http'
import { join } from 'path'
const app = express()
const server = http.createServer(app)
const io: GeckosServer = geckos({
  iceServers: process.env.NODE_ENV === 'production' ? iceServers : [],
  authorization: async (auth, request) => {
    // console.log('auth', auth)
    // console.log('ip', request.connection.remoteAddress)
    // console.log('ip (behind proxy)', request.headers['x-forwarded-for'])
    return true
  }

  // cors: { origin: 'http://localhost:8080' }
  // cors: {
  //   origin: req => {
  //     // do some work and return a string
  //     return 'http://localhost:8080'
  //   }
  // }
})

io.addServer(server)

app.use('/static/client', express.static(join(__dirname, '../client')))

app.get('/', (req, res) => res.sendFile(join(__dirname, '../client/index.html')))

// have to user server instead of app
server.listen(3000, () => {
  console.log('express is on http://localhost:3000')
})

io.onConnection(channel => {
  channel.onDisconnect(reason => {
    // console.log('onDisconnect reason:', reason)
  })

  channel.emit('chat message', `Welcome to the chat ${channel.id}!`)

  // send reliable messages to the client
  io.emit('some reliable event', 'very important message from server [io]', { reliable: true })
  channel.emit('some reliable event', 'very important message from server [channel]', { reliable: true })

  channel.on('chat message', (data: Data) => {
    // emit to all
    io.emit('chat message', `ALL: ${data}`)

    // emit the "chat message" data to all channels in the same room
    channel.room.emit('chat message', `ROOM: ${data}`)

    // emit the "chat message" data to all channels in the same room, except sender
    channel.broadcast.emit('chat message', data)

    // emits a message to the channel
    channel.emit('chat message', `SENT: ${data}`)
  })

  channel.onRaw((rawMessage: RawMessage) => {
    channel.raw.emit('RAW_MESSAGE')
  })
})
