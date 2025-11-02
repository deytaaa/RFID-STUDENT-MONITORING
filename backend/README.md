# RFID Gate Monitoring Backend

A Node.js/Express backend for managing and monitoring an RFID-enabled IoT-based gate and student access control system.

## Features

- **Role-Based Access Control**: Superadmin, admin, and student roles with secure permissions
- **User Management**: Create, edit, deactivate users (students, admins, superadmins)
- **Device Management**: Register and monitor RFID devices
- **Access Logs**: Track and filter all gate access attempts
- **System Settings**: Configure hardware, network, and security options
- **API Endpoints**: RESTful routes for all management features
- **JWT Authentication**: Secure login and token-based session management
- **Debug Logging**: Detailed logs for authentication and authorization

## Technology Stack

- **Node.js** - Backend runtime
- **Express** - Web framework
- **MongoDB** - Database for users, logs, devices
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Socket.io** - Real-time updates

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB instance

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env` (see `.env.example`)
3. Start the server:
   ```bash
   npm start
   ```

## Project Structure

```
backend/
├── src/
│   ├── controllers/   # Route controllers
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── middleware/    # Auth and validation
│   ├── services/      # Hardware/serial services
│   └── utils/         # Utility functions
├── scripts/           # DB seed and utility scripts
└── server.js          # Main server entry
```

## API Documentation

- See `src/routes/` for available endpoints
- All sensitive routes require JWT and proper role

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
