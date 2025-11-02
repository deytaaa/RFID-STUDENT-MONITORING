# RFID Gate Monitoring Dashboard

A modern React.js dashboard for managing and monitoring an RFID-enabled IoT-based gate and access control system.

## Features

- **Real-time Dashboard**: Live monitoring of gate status and system health
- **Access Logs**: Comprehensive logging and filtering of all access attempts
- **User Management**: Add, edit, deactivate, and manage RFID users and permissions (role-based: superadmin, admin, student)
- **Device Management**: Register and monitor RFID devices
- **System Settings**: Configure RFID reader, network, security, and notification settings
- **Modern UI/UX**: Responsive design, modals, notifications, and enhanced management pages
- **Data Visualization**: Interactive charts for access analytics
- **Role-Based Access Control**: Secure management features for superadmins only
- **JWT Authentication**: Secure login and token-based session management
- **Socket.io Client**: Real-time communication

## Technology Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **Recharts** - Data visualization and charts
- **Lucide React** - Modern icon library
- **Socket.io Client** - Real-time communication

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API server running (see backend folder)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Main application pages
├── services/      # API and WebSocket services
├── hooks/         # Custom React hooks
├── models/        # Data models
├── presenters/    # Presentation logic
├── utils/         # Utility functions
└── assets/        # Static assets
```

## Configuration

- The dashboard connects to a backend API. Update the API endpoints in the services folder to match your backend configuration.
- Role-based access is enforced in both frontend and backend.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Best Practices & Recommendations

- Use environment variables for API endpoints and secrets.
- Keep dependencies up to date.
- Test role-based access with different user types.
- Use ESLint and Prettier for code consistency.
- Ensure accessibility for all UI components.
