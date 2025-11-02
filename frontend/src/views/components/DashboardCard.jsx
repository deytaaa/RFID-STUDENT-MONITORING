import './DashboardCard.css'

const DashboardCard = ({ title, value, icon: Icon, color = '#3b82f6' }) => {
  return (
    <div className="dashboard-card">
      <div className="card-icon" style={{ backgroundColor: `${color}20` }}>
        {Icon && <Icon size={24} style={{ color }} />}
      </div>
      <div className="card-content">
        <p className="card-label">{title}</p>
        <h3 className="card-value">{value}</h3>
      </div>
    </div>
  )
}

export default DashboardCard
