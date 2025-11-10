// ==============================
// Backend Server Setup
// ==============================

// Core dependencies
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// ==============================
// Import Models & Routes
// ==============================
const { User, Device, AccessLog, Setting } = require("./src/models");
const testRoutes = require("./src/routes/testRoutes");
const accessLogRoutes = require("./src/routes/accessLogRoutes");
const studentRoutes = require('./src/routes/studentRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/userRoutes');
const settingsRoutes = require('./src/routes/settingsRoutes');

// Arduino Serial Service
const ArduinoSerialService = require('./src/services/ArduinoSerialService');


// ==============================
// Express App Configuration
// ==============================
const app = express();
const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URL || process.env.MONGODB_URI;

// ==============================
// Create HTTP Server & Socket.IO Setup
// ==============================
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// Make io instance available to controllers
app.set('io', io);

// ==============================
// MongoDB Connection
// ==============================
mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==============================
// Middleware
// ==============================
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev")); // Logger

// ==============================
// Routes
// ==============================
app.get("/", (req, res) => {
  res.send("Backend is running successfully with CORS!");
});

app.use("/api/test", testRoutes);
app.use("/api/access-logs", accessLogRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', require('./src/routes/notificationRoutes'));

// Serve profile pictures statically with CORS headers
app.use('/uploads/profile-pictures', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.removeHeader && res.removeHeader('cross-origin-resource-policy');
  // Allow inline styles for React components
  res.header('Content-Security-Policy', "img-src * data:; style-src 'self' 'unsafe-inline'; default-src 'self';");
  next();
}, (req, res, next) => {
  express.static(__dirname + '/uploads/profile-pictures')(req, res, next);
});

// Profile picture upload route
const profilePictureRoutes = require('./src/routes/profilePictureRoutes');
app.use('/api/profile-picture', profilePictureRoutes);


// ==============================
// Arduino Serial Service Setup
// ==============================
const arduinoService = new ArduinoSerialService(io);

// Start Arduino connection when server starts
async function initializeArduino() {
  console.log('🤖 Initializing Arduino connection...');
  const connected = await arduinoService.findAndConnect();
  
  if (connected) {
    console.log('✅ Arduino connected successfully');
  } else {
    console.log('⚠️ Arduino not connected - will retry automatically');
  }
}

// Make Arduino service available to routes
app.set('arduinoService', arduinoService);

server.listen(port, async () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  
  // Initialize Arduino connection
  await initializeArduino();
});

// Export for external access
module.exports = { server, io };
