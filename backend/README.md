# QUACKCESS: RFID Gate Monitoring Backend

A comprehensive Node.js/Express backend for managing and monitoring an RFID-enabled IoT-based gate and student access control system for Pateros Technological College.

## 🚀 Features

### **Authentication & Authorization**

- **JWT-based Authentication**: Secure token-based login system
- **Role-Based Access Control**: Superadmin, admin, and student roles with granular permissions
- **Profile Management**: User profile updates with profile picture uploads
- **Password Security**: Bcrypt encryption for secure password storage

### **Real-Time Hardware Integration**

- **Arduino Serial Communication**: USB serial connection with Arduino RFID reader
- **Real-Time RFID Processing**: Instant card scanning and access control
- **WebSocket Integration**: Live updates to frontend via Socket.IO
- **Hardware Auto-Discovery**: Automatic Arduino port detection and connection
- **Gate Control**: Servo motor control for automated gate opening/closing

### **Student & User Management**

- **Student Registration**: Complete student profile management with RFID card assignment
- **User Administration**: Create, edit, and deactivate users (students, admins, superadmins)
- **Profile Pictures**: Multer-based file upload for student/user profile images
- **Bulk Operations**: Support for bulk student data import/export

### **Access Control & Logging**

- **Real-Time Access Logs**: Comprehensive tracking of all gate access attempts
- **Entry/Exit Distinction**: Separate logging for entry and exit events
- **Access Status Tracking**: Granted, denied, and unauthorized access attempts
- **Advanced Filtering**: Filter logs by date, user, status, and device

### **Smart Notifications System**

- **Real-Time Alerts**: Instant notifications for security events
- **Categorized Notifications**: Security, access, and system notifications
- **Priority Levels**: High, medium, and low priority notifications
- **Persistent Storage**: Database-backed notification system
- **User-Specific Notifications**: Targeted notifications based on user roles

### **Device & System Management**

- **RFID Device Registration**: Register and monitor multiple RFID devices
- **System Health Monitoring**: Real-time system status and health checks
- **Settings Management**: Configurable system settings (auto-lock delay, security options)
- **Device Testing**: Built-in testing endpoints for hardware validation

### **Security Features**

- **CORS Protection**: Secure cross-origin resource sharing
- **Helmet Security**: Security headers and protection middleware
- **Input Validation**: Comprehensive input sanitization and validation
- **Rate Limiting**: Protection against abuse and spam
- **Audit Logging**: Detailed logging of all system activities

## 🛠️ Technology Stack

- **Node.js 16+** - Backend runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional event-based communication
- **SerialPort** - USB serial communication with Arduino
- **JWT** - JSON Web Token authentication
- **Multer** - File upload middleware for profile pictures
- **Bcrypt** - Password hashing and encryption
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Axios** - HTTP client for external API calls

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/           # API route controllers
│   │   ├── AccessLogController.js     # Access log management
│   │   ├── AuthController.js          # Authentication logic
│   │   ├── DeviceController.js        # RFID device management
│   │   ├── NotificationController.js  # Notification system
│   │   ├── SettingsController.js      # System settings
│   │   ├── StudentController.js       # Student management
│   │   ├── SystemController.js        # System health & monitoring
│   │   ├── TestController.js          # Hardware testing
│   │   └── UserController.js          # User management
│   ├── models/                # Mongoose data models
│   │   ├── AccessLog.js       # Access log schema
│   │   ├── Device.js          # Device schema
│   │   ├── Notification.js    # Notification schema
│   │   ├── Settings.js        # System settings schema
│   │   └── User.js            # User/student schema
│   ├── routes/                # Express route definitions
│   │   ├── accessLogRoutes.js         # Access log endpoints
│   │   ├── auth.js                    # Authentication endpoints
│   │   ├── deviceRoutes.js            # Device management endpoints
│   │   ├── notificationRoutes.js      # Notification endpoints
│   │   ├── profilePictureRoutes.js    # File upload endpoints
│   │   ├── settingsRoutes.js          # Settings endpoints
│   │   ├── studentRoutes.js           # Student management endpoints
│   │   ├── systemRoutes.js            # System health endpoints
│   │   ├── testRoutes.js              # Hardware testing endpoints
│   │   └── userRoutes.js              # User management endpoints
│   ├── services/              # Business logic services
│   │   ├── ArduinoSerialService.js    # Arduino communication
│   │   └── ArduinoSerialServiceInstance.js # Service instance
│   ├── middleware/            # Custom middleware
│   │   └── authMiddleware.js  # JWT authentication middleware
│   ├── config/                # Configuration files
│   │   └── database.js        # Database configuration
│   └── utils/                 # Utility functions
├── scripts/                   # Database seed and utility scripts
│   ├── addDevice.js           # Add RFID devices
│   ├── addSampleStudents.js   # Seed sample student data
│   ├── checkCurrentLogs.js    # Log analysis tools
│   ├── checkJohnDoe.js        # Test user verification
│   ├── cleanTestLogs.js       # Clean test data
│   └── fixAccessLogs.js       # Log maintenance
├── uploads/                   # File upload directory
│   └── profile-pictures/      # Student profile pictures
└── server.js                  # Main server entry point
```

## 🚦 Getting Started

### Prerequisites

- **Node.js 16+** and npm
- **MongoDB** instance (local or cloud)
- **Arduino** hardware setup (see hardware folder)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables in `.env`:**

   ```env
   MONGO_URI=mongodb://localhost:27017/rfid-gate-system
   JWT_SECRET=your-secret-key
   PORT=3000
   NODE_ENV=development
   ```

3. **Start the server:**

   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

4. **Seed sample data (optional):**
   ```bash
   node scripts/addSampleStudents.js
   node scripts/addDevice.js
   ```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Students Management

- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/rfid/:cardId` - Get student by RFID card

### Access Logs

- `GET /api/access-logs` - Get access logs with filtering
- `POST /api/access-logs` - Create access log entry
- `DELETE /api/access-logs/:id` - Delete access log
- `DELETE /api/access-logs/clear` - Clear all logs

### Devices

- `GET /api/devices` - Get all RFID devices
- `POST /api/devices` - Register new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Remove device

### System

- `GET /api/system/ping` - Health check endpoint
- `GET /api/system/status` - System status and metrics
- `POST /api/system/test-hardware` - Test hardware connectivity

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications/clear` - Clear all notifications

### Settings

- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

## 🔐 Security

- **JWT Authentication**: All sensitive endpoints require valid JWT tokens
- **Role-Based Access**: Superadmin, admin, and student role restrictions
- **CORS Protection**: Configured for frontend-only access
- **Input Validation**: Comprehensive request validation
- **Password Encryption**: Bcrypt with salt rounds
- **Security Headers**: Helmet.js security middleware

## 🔧 Hardware Integration

The backend communicates with Arduino hardware via USB serial connection:

- **Automatic port detection** for Arduino devices
- **Real-time RFID card processing** with instant feedback
- **Servo motor control** for automated gate operation
- **WebSocket broadcasting** of hardware events to frontend
- **Error handling** and reconnection logic for stable operation

## 📊 Database Schema

### User Model

- Authentication and profile information
- Role-based permissions (superadmin, admin, student)
- RFID card associations
- Profile picture uploads

### AccessLog Model

- Comprehensive access attempt logging
- Timestamp and user association
- Access status (granted, denied, unauthorized)
- Device and location tracking

### Device Model

- RFID device registration and management
- Device status and location tracking
- Hardware configuration settings

### Notification Model

- Real-time notification system
- User-specific and system-wide notifications
- Priority levels and categorization
- Read/unread status tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is developed as a capstone project for Pateros Technological College.

## 👥 Authors

- **Development Team** - QUACKCESS Project Team
- **Institution** - Pateros Technological College
