const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

// Store users as an object: { socketId: { lat, lng } }
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initial update to all clients about the new user (count only for now)
  io.emit('online_count', Object.keys(users).length);

  socket.on('update_location', (data) => {
    // data should be { lat: number, lng: number }
    users[socket.id] = {
      lat: data.lat,
      lng: data.lng,
      id: socket.id
    };

    // Broadcast the full list of users with locations to all clients
    io.emit('users_list', Object.values(users));
    io.emit('online_count', Object.keys(users).length);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];

    // Broadcast updated list and count
    io.emit('users_list', Object.values(users));
    io.emit('online_count', Object.keys(users).length);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
