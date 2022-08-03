const PORT = process.env.PORT || 80;

// 1
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

http.listen(PORT, () => {
  console.log('listening on http://localhost:' + PORT);
});


//2
let connectedUsers = [];

io.on('connection', socket => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  })

  connectedUsers.push(socket.id);
  socket.broadcast.emit('update-user-list', { userIds: connectedUsers });

  socket.on('disconnect', () => {
    connectedUsers = connectedUsers.filter(user => user !== socket.id);
    socket.broadcast.emit('update-user-list', { userIds: connectedUsers });
  });

  // 4
  socket.on('mediaOffer', data => {
    socket.to(data.to).emit('mediaOffer', {
      from: data.from,
      offer: data.offer
    });
  });

  socket.on('mediaAnswer', data => {
    socket.to(data.to).emit('mediaAnswer', {
      from: data.from,
      answer: data.answer
    });
  });

  socket.on('iceCandidate', data => {
    socket.to(data.to).emit('remotePeerIceCandidate', {
      candidate: data.candidate
    });
  });

});

// 3
const path = require('path');
app.use(express.static(path.join(__dirname)));

