const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  console.log('Health check received at:', new Date().toISOString());
  res.status(200).send('Atmosphere Server is Online');
});

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  process.env.FRONTEND_URL
].filter(Boolean).map(url => url.replace(/\/$/, ""));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store users as an object: { socketId: { lat, lng } }
const users = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Initial update to all clients about the new user
  io.emit('online_count', io.engine.clientsCount);

  socket.on('update_location', (data) => {
    // data should be { lat: number, lng: number }
    users[socket.id] = {
      lat: data.lat,
      lng: data.lng,
      id: socket.id
    };

    // Broadcast the updated list of users with locations
    io.emit('users_list', Object.values(users));
    // We already emitted the count on connection, but let's sync just in case
    io.emit('online_count', io.engine.clientsCount);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    delete users[socket.id];

    // Broadcast updated list and count
    io.emit('users_list', Object.values(users));
    io.emit('online_count', io.engine.clientsCount);
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Atmosphere Server Online | Listening on Port ${PORT}`);
});

server.on('error', (err) => {
  console.error('CRITICAL SERVER ERROR:', err);
});
