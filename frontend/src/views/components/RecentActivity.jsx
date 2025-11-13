import { XCircle, Clock } from 'lucide-react'
import './RecentActivity.css'

const RecentActivity = ({ data }) => {
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
            // Get display name from student object first, then fallback to item.user
            let displayName = (item.student && item.student.name && item.student.name !== 'Card not registered') 
                             ? item.student.name 
                             : (item.user || 'Unknown User')
            let statusColor = '#111'
            
            // Check if this is an inactive card (we get this info from the student object in RealTimeRFID)
            const isInactiveCard = item.student && item.student.status === 'inactive'
            console.log('RecentActivity item:', item, 'isInactiveCard:', isInactiveCard, 'displayName:', displayName)
            
            // Determine if this is an entrance or exit activity
            // Check status first, then message, location, or any exit indicators
            const isExit = item.status === 'exited' ||
                          (item.message && (item.message.includes('Exit') || item.message.includes('exit'))) ||
                          (item.location && item.location.toLowerCase().includes('exit')) ||
                          (item.student && item.student.location && item.student.location.toLowerCase().includes('exit'));
            const activityType = isExit ? 'Exit' : 'Entrance';
            
            // Check for unknown user conditions
            const isUnknownUser = displayName === 'Unknown User' || 
                                 displayName === 'Unknown' || 
                                 displayName === 'Card not registered' ||
                                 !displayName ||
                                 (item.student && (item.student.status === 'unauthorized' || item.student.name === 'Card not registered'));
            
            if (isUnknownUser) {
              statusText = `${activityType} - Card Not Registered`
              displayName = 'Unknown User'
              statusColor = '#ef4444'
            } else if (item.status === 'granted' || item.status === 'exited') {
              statusText = `${activityType} - Access Granted`
              statusColor = '#10b981'
            } else if (item.status === 'denied') {
              if (isInactiveCard) {
                statusText = `${activityType} - Account Inactive`
                statusColor = '#f59e0b'
              } else {
                statusText = `${activityType} - Access Denied`
                statusColor = '#ef4444'
              }
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
                      // Get profile picture from student object first, then fallback to item.profilePicture
                      const profilePic = (item.student && item.student.profilePicture) 
                                        ? item.student.profilePicture 
                                        : item.profilePicture;
                      
                      if (!profilePic) {
                        return 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                      }
                      
                      if (profilePic.startsWith('/uploads/profile-pictures/')) {
                        return `http://localhost:3000${profilePic}`;
                      } else if (profilePic.startsWith('http')) {
                        return profilePic;
                      } else {
                        return profilePic;
                      }
                    })()}
                    alt="Profile"
                    className="activity-profile"
                    style={{ width: 48, height: 48, borderRadius: '50%', marginRight: 0, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div className="activity-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <div className="student-name" style={{ fontWeight: 600, fontSize: '1.15rem', textAlign: 'left', marginBottom: 4 }}>{displayName}</div>
                    <div className="student-status" style={{ fontSize: '0.95rem', color: statusColor, fontWeight: 500, textAlign: 'left' }}>{statusText}</div>
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
