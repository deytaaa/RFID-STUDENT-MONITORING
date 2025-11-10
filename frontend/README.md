# QUACKCESS: RFID Gate Monitoring Frontend

A comprehensive React-based frontend dashboard for monitoring and managing an RFID-enabled IoT-based gate and student access control system for Pateros Technological College.

## 🚀 Features

### **Real-Time Monitoring Dashboard**

- **Live RFID Monitor**: Real-time card scanning with instant user identification
- **System Status Display**: Live gate status, connection status, and system health
- **Recent Activity Feed**: Live stream of access attempts with user profiles
- **Interactive System Logs**: Real-time Arduino communication logs
- **Hardware Status Indicators**: Visual indicators for RFID reader connectivity

### **Advanced Access Management**

- **Entry Logs**: Comprehensive access log viewing with filtering and search
- **Exit Logs**: Dedicated exit tracking (hardware-ready for future implementation)
- **Access Analytics**: Visual charts and statistics for access patterns
- **User Identification**: Automatic user lookup with profile pictures
- **Status Categorization**: Clear distinction between granted, denied, and unauthorized access

### **Professional User Management**

- **Student Management**: Complete CRUD operations for student profiles
- **RFID Card Assignment**: Link students to RFID cards with validation
- **Profile Picture Upload**: Drag-and-drop profile picture management
- **Bulk Operations**: Import/export student data capabilities
- **Role-Based Permissions**: Superadmin-only access to sensitive operations

### **Enhanced Notification System**

- **Real-Time Alerts**: Instant notifications for security events and access attempts
- **Professional UI**: Modern notification dropdown with icons and priorities
- **Smart Categorization**: Security, access, and system notification types
- **Persistent Storage**: Notifications persist across browser sessions
- **Priority Indicators**: Visual priority levels with animations
- **Location Context**: Shows gate location and device information

### **Comprehensive System Administration**

- **User Management**: Create and manage admin and superadmin accounts
- **System Settings**: Configure auto-lock delays, security parameters
- **Device Management**: Register and monitor RFID devices
- **System Health**: Real-time backend connectivity monitoring
- **Security Controls**: Role-based access control throughout the application

### **Modern User Experience**

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Professional UI**: Clean, modern interface with consistent styling
- **Interactive Components**: Hover effects, smooth transitions, and animations
- **Intuitive Navigation**: Sidebar navigation with role-based menu items
- **Loading States**: Professional loading indicators and error handling
- **Accessibility**: Keyboard navigation and screen reader support

## 🛠️ Technology Stack

### **Frontend Technologies**

- **React 19** - Modern UI library with hooks and functional components
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing and navigation
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API requests
- **Lucide React** - Modern icon library
- **React Icons** - Additional icon sets
- **Recharts** - Data visualization and charts
- **React Tooltip** - Interactive tooltips
- **jsPDF & jsPDF AutoTable** - PDF generation and export

### **Styling & UI**

- **Custom CSS** - Professional styling with CSS Grid and Flexbox
- **Responsive Design** - Mobile-first approach with media queries
- **CSS Animations** - Smooth transitions and micro-interactions
- **Modern Design System** - Consistent color scheme and typography

### **State Management & Data Flow**

- **React Hooks** - useState, useEffect, useCallback for state management
- **Local Storage** - Client-side data persistence
- **Real-time Updates** - WebSocket-based live data synchronization
- **API Integration** - RESTful API communication with error handling

### **Development Tools**

- **ESLint** - Code linting and style enforcement
- **Vite Dev Server** - Hot module replacement and fast development
- **Modern JavaScript** - ES6+ features and async/await patterns

## 🚦 Getting Started

### Prerequisites

- **Node.js 16+** and npm
- **Backend API server** running on `http://localhost:3000` (see backend folder)
- **Arduino hardware** setup with RFID reader (see hardware folder)
- **MongoDB** instance for data persistence

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure API endpoints** (if different from defaults):

   ```javascript
   // In src/services/ApiService.js, update base URL if needed
   const API_BASE_URL = "http://localhost:3000/api";
   ```

3. **Start the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint code analysis

### Default Login Credentials

For initial setup, use these default credentials:

- **Username:** admin@example.com
- **Password:** admin123
- **Role:** Superadmin

## 📁 Project Structure

```
frontend/
├── src/
│   ├── views/                 # Main application views
│   │   ├── pages/             # Full page components
│   │   │   ├── Dashboard.jsx              # Main dashboard with system overview
│   │   │   ├── AccessLogs.jsx             # Entry logs management
│   │   │   ├── ExitLogs.jsx               # Exit logs (future hardware integration)
│   │   │   ├── EnhancedStudentManagement.jsx  # Student CRUD operations
│   │   │   ├── UserManagement.jsx         # Admin user management
│   │   │   ├── Settings.jsx               # System configuration
│   │   │   ├── LoginPage.jsx              # Authentication page
│   │   │   └── StudentAccessDashboard.jsx # Student-specific dashboard
│   │   └── components/        # Reusable UI components
│   │       ├── Header.jsx     # Top navigation with notifications
│   │       ├── Sidebar.jsx    # Left navigation menu
│   │       ├── RealTimeRFID.jsx       # Live RFID monitoring
│   │       ├── RecentActivity.jsx     # Activity feed component
│   │       ├── DashboardCard.jsx      # Dashboard stat cards
│   │       ├── AccessChart.jsx        # Data visualization
│   │       ├── StudentModals.jsx      # Student form modals
│   │       └── RFIDTestPanel.jsx      # Hardware testing
│   ├── services/              # External service integrations
│   │   ├── ApiService.js      # HTTP API client
│   │   ├── WebSocketService.js        # Real-time communication
│   │   ├── NotificationService.js     # Notification management
│   │   └── IoTDeviceService.js        # Hardware communication
│   ├── presenters/            # Business logic layer
│   │   └── DashboardPresenter.js      # Dashboard state management
│   ├── hooks/                 # Custom React hooks
│   ├── models/                # Data type definitions
│   ├── utils/                 # Utility functions
│   ├── assets/                # Static assets (images, icons)
│   ├── App.jsx                # Main application component
│   ├── App.css                # Global application styles
│   └── main.jsx               # Application entry point
├── public/                    # Static public assets
├── package.json               # Dependencies and scripts
├── vite.config.js             # Vite configuration
└── eslint.config.js           # ESLint configuration
```

## 🎯 Key Components

### **Real-Time RFID Monitor**

- Live card scanning display with user identification
- System status indicators (online/offline, ready/busy)
- Recent activity feed with profile pictures
- Arduino communication logs
- Gate status monitoring

### **Access Management**

- **Entry Logs**: View all access attempts with filtering by date, user, and status
- **Student Management**: Full CRUD operations with profile picture uploads
- **User Management**: Admin account creation and role assignment
- **Advanced Filtering**: Search and filter by multiple criteria

### **Professional Notifications**

- Real-time security alerts with priority indicators
- Categorized notifications (Security, Access, System)
- Persistent notification history with read/unread status
- Professional UI with icons, timestamps, and location context

### **System Administration**

- System settings configuration
- Device management and registration
- User role and permission management
- Real-time system health monitoring

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Different views and permissions for superadmin, admin, and student roles
- **Protected Routes**: Automatic redirection for unauthorized access
- **Session Management**: Secure token storage and automatic logout
- **Input Validation**: Client-side and server-side validation

## 🔧 Hardware Integration

The frontend communicates with Arduino hardware through the backend:

- **Real-time RFID card detection** with instant user lookup
- **Visual feedback** for access granted/denied status
- **Live system monitoring** with connection status indicators
- **Hardware testing tools** for system validation

## 📊 Data Visualization

- **Access Statistics**: Charts showing daily, weekly, and monthly access patterns
- **Real-time Metrics**: Live counters for access attempts and system status
- **User Analytics**: Individual user access history and patterns
- **System Health**: Visual indicators for all system components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Best Practices

- **Component Organization**: Keep components small and focused
- **State Management**: Use React hooks effectively
- **Error Handling**: Implement comprehensive error boundaries
- **Performance**: Optimize re-renders and API calls
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Code Quality**: Follow ESLint rules and maintain consistency

## 📝 License

This project is developed as a capstone project for Pateros Technological College.

## 👥 Authors

- **Development Team** - QUACKCESS Project Team
- **Institution** - Pateros Technological College

## 🆘 Support

For technical support or questions about the system:

1. Check the hardware setup guides in the `/hardware` folder
2. Verify backend API connectivity
3. Review browser console for error messages
4. Ensure proper user roles and permissions are assigned
