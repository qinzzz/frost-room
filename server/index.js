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
  // Log current users and their coordinates
  console.log(`[Connect] Socket: ${socket.id} | Total Online: ${io.engine.clientsCount}`);

  // Initial update to all clients (will be 0 or current count of users with coordinates)
  io.emit('online_count', Object.keys(users).length);

  // Log current users and their coordinates
  console.log('--- Current Users Coordinates ---');
  const userList = Object.values(users);
  if (userList.length === 0) {
    console.log('No users with registered coordinates yet.');
  } else {
    userList.forEach(u => {
      console.log(`User ${u.id.substring(0, 6)}...: ${u.lat}, ${u.lng}`);
    });
  }
  console.log('---------------------------------');

  socket.on('update_location', (data) => {
    // data should be { lat: number, lng: number }
    users[socket.id] = {
      lat: data.lat,
      lng: data.lng,
      id: socket.id
    };

    // Broadcast the updated list of users with locations
    io.emit('users_list', Object.values(users));

    // Log current users and their coordinates on every update
    console.log(`Current souls with coordinates: ${Object.keys(users).length}`);
    Object.values(users).forEach(u => {
      console.log(` > User ${u.id.substring(0, 6)}...: ${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`);
    });
    console.log('--------------------------------------');

    // We emit the count of users who have registered coordinates
    io.emit('online_count', Object.keys(users).length);
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    console.log(`[Disconnect] Socket: ${socket.id} | Total Online (with coords): ${Object.keys(users).length}`);

    // Broadcast updated list and count
    io.emit('users_list', Object.values(users));
    io.emit('online_count', Object.keys(users).length);
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Atmosphere Server Online | Listening on Port ${PORT}`);
});

server.on('error', (err) => {
  console.error('CRITICAL SERVER ERROR:', err);
});
