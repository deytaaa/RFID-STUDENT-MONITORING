import React, { useState, useEffect } from 'react'
import { Search, Download, Filter, Calendar } from 'lucide-react'
import ApiService from '../../services/ApiService.js'
import WebSocketService from '../../services/WebSocketService'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import './AccessLogs.css'

const ExitLogs = ({ user }) => {
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logsPerPage = 10

  useEffect(() => {
    loadExitLogs()

    // Set up WebSocket listeners for real-time updates
    const handleStudentTap = (tapEvent) => {
      // Accept both successful and denied exit events
      if (tapEvent.status === 'exited' || tapEvent.status === 'exit-denied') {
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
    }

    // Handle database deletions
    const handleLogDeleted = (deleteEvent) => {
      console.log('🗑️ Log deleted:', deleteEvent);
      if (deleteEvent.logId || deleteEvent.logIds) {
        const deletedIds = Array.isArray(deleteEvent.logIds) 
          ? deleteEvent.logIds 
          : [deleteEvent.logId];
        
        setLogs(prevLogs => 
          prevLogs.filter(log => !deletedIds.includes(log.id))
        );
        setFilteredLogs(prevFiltered => 
          prevFiltered.filter(log => !deletedIds.includes(log.id))
        );
        console.log('✅ Removed deleted logs from UI');
      }
    }

    // Handle bulk database changes (like clearing all logs)
    const handleLogsCleared = () => {
      console.log('🗑️ All logs cleared');
      setLogs([]);
      setFilteredLogs([]);
    }

    WebSocketService.connect()
    WebSocketService.on('studentTap', handleStudentTap)
    WebSocketService.on('logDeleted', handleLogDeleted)
    WebSocketService.on('logsCleared', handleLogsCleared)
    
    return () => {
      WebSocketService.off('studentTap', handleStudentTap)
      WebSocketService.off('logDeleted', handleLogDeleted)
      WebSocketService.off('logsCleared', handleLogsCleared)
    }
  }, [])

  const loadExitLogs = async () => {
    console.log('🔄 Loading exit logs from database...');
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not authenticated. Please log in.');
      return;
    }
    try {
      const data = await ApiService.get('/access-logs/exit')
      console.log('📊 Exit logs API response:', data);
      
      if (data.success && data.data && data.data.length > 0) {
        // Show both successful and denied exit attempts
        const exitLogs = data.data.filter(log => log.status === 'exited' || log.status === 'exit-denied');
        const transformedLogs = exitLogs.map(log => ({
          id: log._id,
          timestamp: new Date(log.timestamp).toLocaleString(),
          user: log.userId?.name || log.userId?.email || 'Unknown User',
          rfid: log.userId?.rfidTag || log.rfidTag || 'Unknown',
          status: log.status, // 'exited' or 'exit-denied'
          location: log.location || log.deviceId?.location || 'Unknown Location'
        }))
        setLogs(transformedLogs)
        setFilteredLogs(transformedLogs)
      } else {
        // No data found - clear everything
        console.log('📭 No exit logs found in database - clearing UI');
        setLogs([])
        setFilteredLogs([])
      }
    } catch (error) {
      console.error('❌ Error loading exit logs:', error);
      setError('Failed to fetch exit logs.')
      // Clear data on error too
      setLogs([])
      setFilteredLogs([])
    }
    setLoading(false)
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
    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp).toISOString().slice(0,10)
        return logDate === filterDate
      })
    }
    setFilteredLogs(filtered)
    setCurrentPage(1)
  }, [searchTerm, filterDate, logs])

  // Pagination
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

  const handleExportPDF = () => {
    if (!filteredLogs.length) return;
    const doc = new jsPDF();
    doc.text('Exit Logs', 14, 16);
    const tableColumn = ['Timestamp', 'User', 'RFID', 'Status', 'Location'];
    const tableRows = filteredLogs.map(log => [
      log.timestamp,
      log.user,
      log.rfid,
      log.status,
      log.location
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 22 });
    doc.save(`exit_logs_${new Date().toISOString().slice(0,10)}.pdf`);
  }



  // Optional: Auto-refresh every 60 seconds to stay in sync with database
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing exit logs to sync with database...');
      loadExitLogs();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return (
      <div className="access-logs">
        <div className="logs-header">
          <div className="logs-title">
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
          <p>Loading exit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="access-logs">
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
          <button className="btn btn-primary" onClick={loadExitLogs} style={{ marginLeft: '16px' }}>
            Retry
          </button>
        </div>
      )}
      <div className="logs-header">
        {(user && (user.role === 'superadmin' || user.accessLevel === 'superadmin')) && (
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }}  onClick={handleExportPDF}>
            <Download size={16}/>
            Export PDF 
          </button>
        )}
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
                    <span className={`status-badge ${log.status === 'exit-denied' ? 'status-exit-denied' : 'status-entered'}`}>
                      {(log.status || 'exited').toUpperCase()}
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
                    <div className="empty-state-title">No Exit Logs</div>
                    <div className="empty-state-description">
                      Exit logs will appear here when users scan their RFID cards at the exit
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

export default ExitLogs
