import StudentAccessTracker from '../components/StudentAccessTracker'
import RFIDTestPanel from '../components/RFIDTestPanel'
import './StudentAccessDashboard.css'
import React from 'react';

const StudentAccessDashboard = () => {
  return (
    <div className="student-access-dashboard">
      <div className="dashboard-header">
        <h1>School Gate - Student Access Monitor</h1>
        <p className="dashboard-subtitle">Real-time RFID student access tracking</p>
      </div>
      
      <StudentAccessTracker />
      
      {/* Test Panel for simulating RFID taps */}
      <RFIDTestPanel />
    </div>
  )
}

export default StudentAccessDashboard
