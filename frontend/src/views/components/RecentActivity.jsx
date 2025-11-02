import { CheckCircle, XCircle, Clock } from 'lucide-react'
import './RecentActivity.css'

const RecentActivity = ({ data }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'granted':
        return <CheckCircle size={14} className="status-icon granted" />
      case 'denied':
        return <XCircle size={14} className="status-icon denied" />
      default:
        return <Clock size={14} className="status-icon pending" />
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case 'granted':
        return 'activity-granted'
      case 'denied':
        return 'activity-denied'
      default:
        return 'activity-pending'
    }
  }

  return (
    <div className="recent-activity">
      {data.length === 0 ? (
        <div className="no-activity">
          <Clock size={32} className="no-activity-icon" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="activity-list">
          {data.map((item) => (
            <div key={item.id} className={`modern-activity-item ${getStatusClass(item.status)}`}>
              <div className="activity-left">
                <div className="activity-icon-circle">
                  {getStatusIcon(item.status)}
                </div>
                <div className="activity-content">
                  <div className="student-name">{item.user}</div>
                  <div className="student-rfid">RF{item.rfid}</div>
                </div>
              </div>
              <div className="activity-status-badge">
                {(item.status || 'unknown').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
