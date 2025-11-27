import { XCircle, Clock, Loader } from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)
import './RecentActivity.css'

const RecentActivity = ({ data, loading = false }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'granted':
      case 'exited':
        return 'activity-granted'
      case 'denied':
        return 'activity-denied'  
      default:
        return 'activity-pending'
    }
  }

  // Show only the 5 most recent activities
  const recentData = data.slice(0, 5)

  return (
    <div className="recent-activity">
      {loading ? (
        <div className="no-activity">
          <Loader size={32} className="no-activity-icon loading-spin" />
          <p>Loading recent activity...</p>
        </div>
      ) : recentData.length === 0 ? (
        <div className="no-activity">
          <Clock size={32} className="no-activity-icon" />
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="activity-list">
          {recentData.map((item) => {
            console.log('RecentActivity item:', item); // DEBUG: See what status is received
            let statusText = ''
            let displayName = (item.student && item.student.name && item.student.name !== 'Card not registered') 
                             ? item.student.name 
                             : (item.user || 'Unknown User')
            let statusColor = '#111'
            const isInactiveCard = item.student && item.student.status === 'inactive';
            const isExit = item.status === 'exited' || item.status === 'exit-denied' ||
              (item.message && (item.message.includes('Exit') || item.message.includes('exit')))
            const activityType = isExit ? 'Exit' : 'Entrance';
            const isUnknownUser = displayName === 'Unknown User' || 
                                 displayName === 'Unknown' || 
                                 displayName === 'Card not registered' ||
                                 !displayName ||
                                 (item.student && (item.student.status === 'unauthorized' || item.student.name === 'Card not registered'));
            if (isInactiveCard) {
              statusText = `${activityType} - Account Inactive`;
              statusColor = '#f59e0b';
            } else if (isUnknownUser) {
              statusText = `${activityType} - Card Not Registered`
              displayName = 'Unknown User'
              statusColor = '#ef4444'
            } else if (item.status === 'granted' || item.status === 'exited') {
              statusText = `${activityType} - Access Granted`
              statusColor = '#10b981'
            } else if (item.status === 'denied' || item.status === 'exit-denied') {
              statusText = `${activityType} - Access Denied`
              statusColor = '#ef4444'
            } else {
              statusText = `${activityType} - Card Not Registered`
              displayName = 'Unknown User'
              statusColor = '#ef4444'
            }
            return (
              <div key={item.id} className={`modern-activity-item ${getStatusClass(item.status)}`}>
                <div className="activity-left" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img
                    src={(() => {
                      let profilePic = (item.student && item.student.profilePicture)
                        ? item.student.profilePicture
                        : (item.profilePicture || 'https://cdn-icons-png.flaticon.com/512/149/149071.png');
                      // If the profilePic is a relative path, prepend the backend URL
                      if (profilePic && !profilePic.startsWith('http')) {
                        profilePic = `http://localhost:3000${profilePic}`;
                      }
                      return profilePic;
                    })()}
                    alt="Profile"
                    className="activity-profile-pic"
                    
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                    }}
                  />
                  <div>
                    <div className="student-name" style={{ fontWeight: 600, textAlign: 'left', width: '100%', display: 'block' }}>{displayName}</div>
                    <div className="student-status" style={{ fontSize: '0.95rem', color: statusColor, fontWeight: 500, textAlign: 'left' }}>{statusText}</div>
                    <div className="activity-timestamp" style={{ fontSize: '0.85rem', color: '#64748b' }}>{dayjs(item.timestamp).format('MM/DD/YYYY, h:mm:ss A')}</div>
                  </div>
                </div>
                <div className="activity-status-badge">
                  {item.status === 'exited' ? 'EXITED' : (item.status === 'granted' ? (isExit ? 'EXITED' : 'ENTERED') : (item.status || 'unknown').toUpperCase())}
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
