import React, { useState, useEffect } from 'react'
import { Search, Download, Filter, Calendar } from 'lucide-react'
import ApiService from '../../services/ApiService.js'
import WebSocketService from '../../services/WebSocketService'
import './AccessLogs.css'

const AccessLogs = () => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logsPerPage = 10

  useEffect(() => {
    loadAccessLogs()

    // Set up WebSocket listener for real-time student taps
    const handleStudentTap = (tapEvent) => {
      console.log('🔔 New student tap in AccessLogs:', tapEvent)
      
      // Add new tap to logs (prepend to show latest first)
      const newLog = {
        id: tapEvent.id,
        timestamp: new Date(tapEvent.timestamp).toLocaleString(),
        user: tapEvent.user,
        rfid: tapEvent.rfid,
        status: tapEvent.status,
        location: tapEvent.location
      }
      
      setLogs(prevLogs => [newLog, ...prevLogs])
      setFilteredLogs(prevFiltered => [newLog, ...prevFiltered])
    }

    // Connect WebSocket and listen for student taps
    WebSocketService.connect()
    WebSocketService.on('studentTap', handleStudentTap)

    // Cleanup on unmount
    return () => {
      WebSocketService.off('studentTap', handleStudentTap)
    }
  }, [])

  const loadAccessLogs = async () => {
    setLoading(true)
    setError(null)
    // Only fetch if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not authenticated. Please log in.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/access-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success && data.data) {
        // Transform backend data to frontend format
        const transformedLogs = data.data.map(log => ({
          id: log._id,
          timestamp: new Date(log.timestamp).toLocaleString(),
          user: log.userId?.name || log.userId?.email || 'Unknown User',
          rfid: log.userId?.rfidTag || log.rfidTag || 'Unknown',
          status: log.status,
          location: log.deviceId?.location || 'Unknown Location'
        }))
        
        setLogs(transformedLogs)
        setFilteredLogs(transformedLogs)
      } else {
        // Backend returned no data - show clean empty state
        setLogs([])
        setFilteredLogs([])
      }
    } catch (err) {
      console.error('Failed to load access logs:', err)
      
      // For demo purposes, provide some sample data when backend is unavailable
      const demoData = [
        {
          id: 'demo-1',
          timestamp: new Date(Date.now() - 2 * 60000).toLocaleString(),
          user: 'Demo User',
          rfid: 'DEMO001',
          status: 'entered',
          location: 'Main Gate'
        },
        {
          id: 'demo-2', 
          timestamp: new Date(Date.now() - 5 * 60000).toLocaleString(),
          user: 'Sample Student',
          rfid: 'DEMO002',
          status: 'entered',
          location: 'Main Gate'
        },
        {
          id: 'demo-3',
          timestamp: new Date(Date.now() - 12 * 60000).toLocaleString(),
          user: 'Unknown User',
          rfid: 'DEMO999',
          status: 'denied',
          location: 'Main Gate'
        }
      ]
      
      setLogs(demoData)
      setFilteredLogs(demoData)
      setError('Backend unavailable - showing demo data. Real data will appear when server is connected.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = logs

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.rfid.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus)
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().slice(0,10)
        return logDate === filterDate
      })
    }

    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterDate, logs])

  const handleExport = () => {
    if (!filteredLogs.length) return;
    // Define CSV headers
    const headers = ['Timestamp', 'User', 'RFID', 'Status', 'Location'];
    // Map logs to CSV rows
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.user}"`,
      `"${log.rfid}"`,
      `"${log.status}"`,
      `"${log.location}"`
    ].join(','));
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    // Create a Blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_logs_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const getStatusClass = (status) => {
    if (!status) return 'status-unknown'
    return status === 'entered' ? 'status-entered' : 'status-denied'
  }

  if (loading) {
    return (
      <div className="access-logs">
        <div className="logs-header">
          <div className="logs-title">
            <h2>Access Logs</h2>
            <p className="logs-subtitle">Monitor all gate access attempts</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading access logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="access-logs">
      {/* Show connection warning if backend is unavailable but we have demo data */}
      {error && error.includes('demo data') && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
          <button className="btn btn-primary" onClick={loadAccessLogs} style={{ marginLeft: '16px' }}>
            Retry Connection
          </button>
        </div>
      )}
      
      <div className="logs-header">
        <div className="logs-title">
          <h2>Access Logs</h2>
          <p className="logs-subtitle">Monitor all gate access attempts</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="logs-filters">
        <div className="search-filter">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name or RFID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filter">
          <Filter size={16} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="entered">Entered</option>
            <option value="denied">Denied</option>
          </select>
        </div>

        <div className="date-filter">
          <Calendar size={16} />
          <input type="date" className="date-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>RFID</th>
              <th>Status</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">{log.timestamp}</td>
                  <td className="user">{log.user}</td>
                  <td className="rfid">{log.rfid}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(log.status)}`}>
                      {(log.status || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td className="location">{log.location}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '60px' }}>
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-title">No Access Logs</div>
                    <div className="empty-state-description">
                      Access logs will appear here when users scan their RFID cards
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>
          
          <div className="page-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default AccessLogs
