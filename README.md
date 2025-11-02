# RFID-Enabled and IoT-Based Gate and Monitoring System

## Overview

This project is a full-stack solution for automating and monitoring gate access using RFID technology, IoT hardware, and a web dashboard. It features real-time logging, user management, and hardware integration for secure and efficient access control.

## Technologies Used

- **Backend:** Node.js, Express, MongoDB (Mongoose), Socket.IO
- **Frontend:** React, Vite, Lucide-react
- **Hardware:** Arduino (RFID, Servo, Buzzer)

## Folder Structure

- `backend/` - Node.js/Express API, controllers, models, Arduino serial service
- `frontend/` - React/Vite web dashboard and settings page
- `hardware/` - Arduino code, wiring guides, hardware documentation

## Setup Instructions

### Backend

1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Configure MongoDB connection in `src/config/databas.js`.
3. Start the server:
   ```powershell
   npm start
   ```

### Frontend

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the frontend:
   ```powershell
   npm run dev
   ```

### Hardware

- See guides in `hardware/` for wiring, setup, and Arduino code upload.
- Main Arduino sketch: `hardware/arduino_rfid_gate/arduino_rfid_gate.ino`

## Features

- Real-time dashboard (system uptime, logs)
- Settings page (update auto lock delay, etc.)
- Hardware sync (auto lock delay sent to Arduino)
- User and device management

## Updating Settings

- Change settings (e.g., `autoLockDelay`) via the frontend Settings page.
- Backend syncs settings to hardware automatically.
- Ensure the database value for `autoLockDelay` is valid for correct gate delay.

## Troubleshooting

- If auto lock delay is stuck, check the database value and backend logs.
- For git/source control issues:
  1. Resolve all merge conflicts.
  2. Add and commit changes:
     ```powershell
     git add .
     git commit -m "Resolve conflicts and update settings"
     git push
     ```

## Documentation & Guides

- Hardware setup: `hardware/HARDWARE_SETUP_GUIDE.md`
- Arduino libraries: `hardware/ARDUINO_LIBRARIES_GUIDE.md`
- Realtime dashboard: `hardware/REALTIME_DASHBOARD_GUIDE.md`
- Adding students: `hardware/ADD_STUDENTS_GUIDE.md`
- USB serial connection: `hardware/USB_SERIAL_CONNECTION_GUIDE.md`
- Development roadmap: `hardware/DEVELOPMENT-ROADMAP.md`

## Authors

- Project contributors: See commit history and hardware guides.

---

_Last updated: November 2, 2025_
