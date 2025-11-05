import { XCircle, Clock } from 'lucide-react'
import './RecentActivity.css'

const RecentActivity = ({ data }) => {
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
          {data.map((item) => {
            let statusText = ''
            let displayName = item.user
            if (item.user === 'Unknown' || !item.user || item.user === 'Card not registered') {
              statusText = 'Not Registered'
              displayName = 'Unknown User'
            } else if (item.status === 'granted') {
              statusText = 'Student - Active'
            } else if (item.status === 'denied') {
              statusText = 'Student Not Active'
            } else {
              statusText = 'Not Registered'
              displayName = 'Unknown User'
            }
            return (
              <div key={item.id} className={`modern-activity-item ${getStatusClass(item.status)}`}>
                <div className="activity-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={item.profilePicture
                      ? (item.profilePicture.startsWith('/uploads/profile-pictures/')
                          ? `http://localhost:3000${item.profilePicture}`
                          : item.profilePicture.startsWith('http')
                            ? item.profilePicture
                            : item.profilePicture)
                      : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt="Profile"
                    className="activity-profile"
                    style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 0, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div className="activity-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <div className="student-name" style={{ fontWeight: 600, fontSize: '1.15rem', textAlign: 'left', marginBottom: 4 }}>{displayName}</div>
                    <div className="student-status" style={{ fontSize: '0.95rem', color: '#111', fontWeight: 500, textAlign: 'left' }}>{statusText}</div>
                  </div>
                </div>
                <div className="activity-status-badge">
                  {(item.status || 'unknown').toUpperCase()}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
