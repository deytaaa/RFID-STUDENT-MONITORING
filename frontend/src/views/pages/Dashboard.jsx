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
  const [systemMetrics, setSystemMetrics] = useState({ rfidReader: 'connected', database: 'connected', network: 'strong' });
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10); // yyyy-mm-dd
  });

  // Calculate days in selected month/year for day dropdown
  const daysInMonth = new Date(new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1, 0).getDate();

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
            return logDate.getFullYear() === new Date(selectedDate).getFullYear() && logDate.getMonth() === new Date(selectedDate).getMonth();
          })
        : [];
      // Filter logs for the selected day (local time, matches chart logic)
      const selectedDay = new Date(selectedDate).getDate();
      const selectedMonth = new Date(selectedDate).getMonth();
      const selectedYear = new Date(selectedDate).getFullYear();
      const selectedDayLogs = monthLogs.filter((log) => {
        const logDate = new Date(log.timestamp);
        return (
          logDate.getFullYear() === selectedYear &&
          logDate.getMonth() === selectedMonth &&
          logDate.getDate() === selectedDay
        );
      });
      setStats({
        totalAccess: monthLogs.filter((log) => log.accessGranted === true && log.direction !== "exit").length,
        totalDenied: monthLogs.filter((log) => log.accessGranted === false).length,
        authorizedToday: selectedDayLogs.filter((log) => log.accessGranted === true && log.direction !== "exit").length,
        deniedToday: selectedDayLogs.filter((log) => log.accessGranted === false).length,
        totalExit: monthLogs.filter((log) => log.accessGranted === true && log.direction === "exit").length,
        todayExit: selectedDayLogs.filter((log) => log.accessGranted === true && log.direction === "exit").length,
        systemUptime: uptimeString,
      });

      // Prepare chart data for the selected month/year
      const year = new Date(selectedDate).getFullYear();
      const month = new Date(selectedDate).getMonth();
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
                  log.accessGranted === true && log.direction !== 'exit';
              }).length
            : 0,
          denied: logs.success
            ? logs.data.filter((log) => {
                const logDate = new Date(log.timestamp);
                return logDate.getFullYear() === year &&
                  logDate.getMonth() === month &&
                  logDate.getDate() === dayDate.getDate() &&
                  log.accessGranted === false && log.direction !== 'exit';
              }).length
            : 0,
          exited: logs.success
            ? logs.data.filter((log) => {
                const logDate = new Date(log.timestamp);
                return logDate.getFullYear() === year &&
                  logDate.getMonth() === month &&
                  logDate.getDate() === dayDate.getDate() &&
                  log.accessGranted === true && log.direction === 'exit';
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
  }, [selectedDate]);

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

      <div className="dashboard-main-cards" style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'start', marginBottom: '32px' }}>
        {/* System Status */}
        <div className="card modern-card" style={{ width: 600, minWidth: 320, maxWidth: 600 }}>
          <div className="card-header-modern" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="card-title-modern" style={{ marginBottom: 8 }}>System Status</h3>
            <div className="status-indicator status-online" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef4ff', borderRadius: 8, padding: '4px 16px', margin: 0 }}>
              <Wifi size={16} />
              <span style={{ fontWeight: 600, color: '#22c55e', fontSize: '1.1rem' }}>ONLINE</span>
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
          <div className="card modern-card access-analytics-centered" style={{ width: 600, minWidth: 320, maxWidth: 600, margin: '0 auto' }}>
            <div className="card-header-modern" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3 className="card-title-modern" style={{ marginBottom: 8 }}>Access Analytics</h3>
              <div className="card-subtitle-modern" style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>Selected Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '1rem' }}
                />
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