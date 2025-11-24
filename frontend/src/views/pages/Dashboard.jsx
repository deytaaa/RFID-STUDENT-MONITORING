import React,{ useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  AlertTriangle,
  Activity,
  Wifi,
  LogOut,
  LogIn
} from "lucide-react";
import DashboardCard from "../components/DashboardCard";
import AccessChart from "../components/AccessChart";
import WebSocketService from "../../services/WebSocketService";
import ApiService from "../../services/ApiService.js";
import "./Dashboard.css";

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalAccess: 0,
    totalDenied: 0,
    authorizedToday: 0,
    deniedToday: 0,
    totalExit: 0,
    todayExit: 0,
    systemUptime: "100%",
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gateStatus, setGateStatus] = useState('closed');
  const [systemMetrics, setSystemMetrics] = useState({ rfidReader: 'connected', database: 'connected', network: 'strong' });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      setError("Not authenticated. Please log in.");
      return;
    }
    try {
      const logs = await ApiService.get('/access-logs');
      const statusJson = await ApiService.get('/system/status');
      let uptimeString = "N/A";
      if (statusJson.success && statusJson.data) {
        if (statusJson.data.metrics) {
          setSystemMetrics(statusJson.data.metrics);
        }
        if (typeof statusJson.data.uptime === "number") {
          const uptimeSec = statusJson.data.uptime;
          const hours = Math.floor(uptimeSec / 3600);
          const minutes = Math.floor((uptimeSec % 3600) / 60);
          const seconds = Math.floor(uptimeSec % 60);
          uptimeString = `${hours}h ${minutes}m ${seconds}s`;
        }
      }

      // Calculate stats for selected month/year
      const monthLogs = logs.success
        ? logs.data.filter((log) => {
            const logDate = new Date(log.timestamp);
            return logDate.getFullYear() === selectedYear && logDate.getMonth() === selectedMonth;
          })
        : [];
      const todayLogs = monthLogs.filter((log) => {
        const today = new Date();
        return new Date(log.timestamp).toDateString() === today.toDateString();
      });
      setStats({
        totalAccess: monthLogs.filter((log) => log.accessGranted === true && log.direction !== "exit").length,
        totalDenied: monthLogs.filter((log) => log.accessGranted === false).length,
        authorizedToday: todayLogs.filter((log) => log.accessGranted === true && log.direction !== "exit").length,
        deniedToday: todayLogs.filter((log) => log.accessGranted === false).length,
        totalExit: monthLogs.filter((log) => log.accessGranted === true && log.direction === "exit").length,
        todayExit: todayLogs.filter((log) => log.accessGranted === true && log.direction === "exit").length,
        systemUptime: uptimeString,
      });

      // Prepare chart data for the selected month/year
      const year = selectedYear;
      const month = selectedMonth;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const dayDate = new Date(year, month, i + 1);
        const dayLabel = `${dayDate.getDate()}`;
        return {
          day: dayLabel,
          granted: logs.success
            ? logs.data.filter((log) => {
                const logDate = new Date(log.timestamp);
                return logDate.getFullYear() === year &&
                  logDate.getMonth() === month &&
                  logDate.getDate() === dayDate.getDate() &&
                  log.accessGranted === true;
              }).length
            : 0,
          denied: logs.success
            ? logs.data.filter((log) => {
                const logDate = new Date(log.timestamp);
                return logDate.getFullYear() === year &&
                  logDate.getMonth() === month &&
                  logDate.getDate() === dayDate.getDate() &&
                  log.accessGranted === false;
              }).length
            : 0,
        };
      });
      setChartData(chartData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);

      setStats({
        totalAccess: 105,
        totalDenied: 20,
        authorizedToday: 8,
        deniedToday: 2,
        totalExit: 50,
        todayExit: 4,
        systemUptime: "99.5%",
      });
      setChartData([]);
      setError(
        "Backend unavailable - showing demo data. Real data will appear when server is connected."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    loadDashboardData();

    const handleStudentTap = () => {
      loadDashboardData();
    };

    WebSocketService.connect();
    WebSocketService.on("studentTap", handleStudentTap);

    return () => {
      WebSocketService.off("studentTap", handleStudentTap);
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div
            className="loading-spinner"
            style={{ margin: "0 auto 16px" }}
          ></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {error && error.includes("demo data") && (
        <div className="alert alert-warning" style={{ marginBottom: "20px" }}>
          <AlertTriangle size={16} />
          {error}
          <button
            className="btn btn-primary"
            onClick={loadDashboardData}
            style={{ marginLeft: "16px" }}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <DashboardCard
          title="Total Entries"
          value={stats.totalAccess.toLocaleString()}
          icon={Shield}
          color="#16a34a"
        />
        <DashboardCard
          title="Today's Entries"
          value={stats.authorizedToday}
          icon={Users}
          color="#10b981"
        />
        <DashboardCard
          title="Total Exits"
          value={stats.totalExit}
          icon={LogOut}
          color="#3b82f6"
        />
        <DashboardCard
          title="Today's Exits"
          value={stats.todayExit}
          icon={LogIn}
          color="#2563eb"
        />
        <DashboardCard
          title="Total Denied"
          value={stats.totalDenied}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <DashboardCard
          title="Today's Denied"
          value={stats.deniedToday}
          icon={AlertTriangle}
          color="#ef4444"
        />
        <DashboardCard
          title="System Uptime"
          value={stats.systemUptime}
          icon={Activity}
          color="#8b5cf6"
        />
      </div>

      <div className="dashboard-main-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'flex-start', marginBottom: '32px' }}>
        {/* School Gate Control */}
        <div className="card modern-card" style={{ flex: '1 1 340px', minWidth: '320px', maxWidth: '400px' }}>
          <div className="card-header-modern">
            <h3 className="card-title-modern">School Gate Control</h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', padding: '24px 0' }}>
            <button
              className="btn btn-success"
              disabled={gateStatus === 'opened'}
              style={gateStatus === 'opened' ? { background: '#16a34a', color: '#fff', cursor: 'not-allowed' } : {}}
              onClick={async () => {
                try {
                  const result = await ApiService.post('/system/gate', { action: 'open' });
                  if (result.success) {
                    setGateStatus('opened');
                  } else {
                    setGateStatus('error');
                  }
                } catch {
                  setGateStatus('error');
                }
              }}
            >{gateStatus === 'opened' ? 'Opened' : 'Open Gate'}</button>
            <button
              className="btn btn-danger"
              disabled={gateStatus === 'closed'}
              style={gateStatus === 'closed' ? { background: '#ef4444', color: '#fff', cursor: 'not-allowed' } : {}}
              onClick={async () => {
                try {
                  const result = await ApiService.post('/system/gate', { action: 'close' });
                  if (result.success) {
                    setGateStatus('closed');
                  } else {
                    setGateStatus('error');
                  }
                } catch {
                  setGateStatus('error');
                }
              }}
            >{gateStatus === 'closed' ? 'Closed' : 'Close Gate'}</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {gateStatus === 'error' && <span style={{ color: '#f59e0b' }}>Gate control failed</span>}
          </div>
        </div>
        {/* System Status */}
        <div className="card modern-card" style={{ flex: '1 1 340px', minWidth: '320px', maxWidth: '400px' }}>
          <div className="card-header-modern">
            <h3 className="card-title-modern">System Status</h3>
            <div className="status-indicator status-online">
              <Wifi size={16} />
              ONLINE
            </div>
          </div>
          <div className="system-metrics">
            <div className="metric">
              <span className="metric-label">RFID Reader</span>
              <span className={`metric-value ${systemMetrics.rfidReader === 'connected' ? 'online' : 'offline'}`}>{systemMetrics.rfidReader === 'connected' ? 'Connected' : 'Disconnected'}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Database</span>
              <span className="metric-value online">Connected</span>
            </div>
            <div className="metric">
              <span className="metric-label">Network</span>
              <span className="metric-value online">Strong Signal</span>
            </div>
          </div>
        </div>
        {/* Access Analytics - Centered */}
        {(user && (user.role === 'superadmin' || user.accessLevel === 'superadmin')) && (
          <div className="card modern-card access-analytics-centered" style={{ width: 600, height: 480, margin: '0 auto' }}>
            <div className="card-header-modern" style={{ textAlign: 'center' }}>
              <h3 className="card-title-modern">Access Analytics</h3>
              <p className="card-subtitle-modern">Selected Month: {selectedYear}-{String(selectedMonth+1).padStart(2,'0')}</p>
              <div className="analytics-selector">
                <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
                <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
                  ))}
                </select>
              </div>
            </div>
            <AccessChart data={chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;