# QUACKCESS: RFID-ENABLED AND IOT-BASED GATE AND MONITORING SYSTEM FOR STUDENTS AT PATEROS TECHNOLOGICAL COLLEGE

A full-stack system for secure, real-time monitoring and management of student access using RFID and IoT hardware.

## Features

- **Real-time Dashboard**: Live monitoring of gate status, system health, and student activity
- **Entry & Exit Logs**: Distinguish, filter, and paginate both entry and exit events
- **User Management**: Add, edit, deactivate, and manage RFID users and permissions (superadmin, admin, student)
- **Device Management**: Register, monitor, and test RFID devices (entry/exit)
- **System Settings**: Configure RFID reader, network, security, and notification settings
- **Modern UI/UX**: Responsive design, modals, notifications, and enhanced management pages
- **Data Visualization**: Interactive charts for access analytics
- **Role-Based Access Control**: Secure management features for superadmins only
- **JWT Authentication**: Secure login and token-based session management
- **Socket.io Client**: Real-time communication for live updates
- **PDF Export**: Download entry/exit logs as PDF files
- **Hardware Integration**: Arduino-based RFID, servo, and buzzer control

## Technology Stack

**Frontend:**

- React (UI library)
- Vite (build tool)
- Lucide-react, react-icons (icons)
- Axios (API requests)
- Socket.io-client (real-time updates)
- Recharts (charts)
- jsPDF & jspdf-autotable (PDF export)
- CSS (styling)

**Backend:**

- Node.js (runtime)
- Express (web server)
- MongoDB (database)
- Mongoose (ODM)
- Socket.io (real-time)
- SerialPort (hardware integration)
- Multer (file uploads)
- JWT (authentication)
- Helmet, CORS, Morgan (security/logging)
- dotenv (env config)
- bcrypt/bcryptjs (password hashing)

**Hardware:**

- Arduino (RFID, Servo, Buzzer)
- Serial communication with backend

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend API server running (see backend folder)
- Arduino hardware setup (see hardware folder)

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
frontend/src/
├── components/     # Reusable UI components
├── pages/         # Main application pages (AccessLogs, ExitLogs, UserManagement, etc.)
├── services/      # API and WebSocket services
├── hooks/         # Custom React hooks
├── models/        # Data models
├── presenters/    # Presentation logic
├── utils/         # Utility functions
└── assets/        # Static assets
backend/src/
├── controllers/   # API route logic
├── models/        # Mongoose models
├── routes/        # Express routes
├── middleware/    # Auth, validation, etc.
├── services/      # Serial, hardware, etc.
└── utils/         # Helpers
hardware/
├── arduino_rfid_gate/   # Arduino code for gate
├── buzzer_test/         # Arduino code for buzzer
├── ...                  # Other hardware sketches and guides
```

## Configuration

- Update API endpoints in the services folder to match your backend configuration.
- Role-based access is enforced in both frontend and backend.
- Hardware setup guides are in the hardware folder.

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
- Follow hardware setup guides for reliable operation.
