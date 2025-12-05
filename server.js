const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();
const messageHistory = [];
const MAX_HISTORY = 50;

io.on('connection', (socket) => {
  console.log('Foydalanuvchi ulandi:', socket.id);

  socket.on('user joined', (username) => {
    users.set(socket.id, username);

    socket.emit('message history', messageHistory);

    io.emit('user notification', {
      type: 'join',
      username: username,
      timestamp: new Date().toISOString()
    });

    io.emit('update users', Array.from(users.values()));

    console.log(`${username} suhbatga qo'shildi`);
  });

  socket.on('chat message', (data) => {
    const username = users.get(socket.id);

    if (username && data.message.trim()) {
      const messageData = {
        username: username,
        message: data.message,
        timestamp: new Date().toISOString()
      };

      messageHistory.push(messageData);

      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }

      io.emit('chat message', messageData);
    }
  });

  socket.on('typing', () => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('user typing', username);
    }
  });

  socket.on('stop typing', () => {
    socket.broadcast.emit('user stop typing');
  });

  socket.on('disconnect', () => {
    const username = users.get(socket.id);

    if (username) {
      io.emit('user notification', {
        type: 'leave',
        username: username,
        timestamp: new Date().toISOString()
      });

      users.delete(socket.id);
      io.emit('update users', Array.from(users.values()));

      console.log(`${username} suhbatdan chiqdi`);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} da ishlamoqda`);
});
