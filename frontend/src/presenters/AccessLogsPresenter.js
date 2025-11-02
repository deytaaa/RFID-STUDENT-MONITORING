import { BasePresenter } from './BasePresenter.js'
import AccessLogModel from '../models/AccessLogModel.js'
import ApiService from '../services/ApiService.js'
import { ExportUtils } from '../utils/index.js'

export class AccessLogsPresenter extends BasePresenter {
  constructor() {
    super()
    this.accessLogModel = new AccessLogModel()
    this.currentPage = 1
    this.logsPerPage = 10
    
    // Initialize with real data from backend
    this.initializeData()
  }

  async initializeData() {
    try {
      await this.loadAccessLogs()
    } catch (error) {
      console.warn('Failed to load data from backend, using fallback data:', error)
      this.initializeMockData()
    }
  }

  async loadAccessLogs() {
    try {
      const response = await ApiService.getAccessLogs({ 
        page: this.currentPage, 
        limit: this.logsPerPage,
        sort: '-timestamp'
      })
      
      if (response.success && response.data) {
        this.accessLogModel.logs = response.data.map(log => ({
          id: log._id,
          timestamp: new Date(log.timestamp).toLocaleString(),
          user: log.userId?.name || log.userId?.email || 'Unknown User',
          rfid: log.userId?.rfidTag || 'Unknown',
          status: log.status,
          location: log.deviceId?.location || 'Unknown Location',
          course: log.userId?.course || 'Unknown',
          yearLevel: log.userId?.yearLevel || 'Unknown'
        }))
        
        this.totalPages = response.pages || 1
        this.totalLogs = response.total || 0
      }
    } catch (error) {
      console.error('Failed to load access logs:', error)
      throw error
    }
  }

  initializeMockData() {
    const mockLogs = [
      { id: 1, timestamp: '2025-10-13 15:30:25', user: 'Manuel Data', rfid: 'ST001234', status: 'granted', location: 'Main Gate', course: 'BSIT', yearLevel: '3rd Year' },
      { id: 2, timestamp: '2025-10-13 15:25:10', user: 'Jane Smith', rfid: 'ST005678', status: 'granted', location: 'Main Gate', course: 'CCS', yearLevel: '1st Year' },
      { id: 3, timestamp: '2025-10-13 15:20:45', user: 'Unknown Student', rfid: 'ST999999', status: 'denied', location: 'Main Gate', course: 'Unknown', yearLevel: 'Unknown' },
      { id: 4, timestamp: '2025-10-13 15:15:30', user: 'Mike Johnson', rfid: 'ST003456', status: 'granted', location: 'Main Gate', course: 'BSOA', yearLevel: '4th Year' },
      { id: 5, timestamp: '2025-10-13 15:10:15', user: 'Sarah Wilson', rfid: 'ST007890', status: 'granted', location: 'Main Gate', course: 'COA', yearLevel: '2nd Year' },
      { id: 6, timestamp: '2025-10-13 15:05:00', user: 'Unknown Student', rfid: 'ST888888', status: 'denied', location: 'Main Gate', course: 'Unknown', yearLevel: 'Unknown' },
      { id: 7, timestamp: '2025-10-13 14:55:45', user: 'David Brown', rfid: 'ST002345', status: 'granted', location: 'Main Gate', course: 'ABA', yearLevel: '2nd Year' },
      { id: 8, timestamp: '2025-10-13 14:50:30', user: 'Emily Davis', rfid: 'ST006789', status: 'granted', location: 'Main Gate', course: 'AAIS', yearLevel: '1st Year' },
      { id: 9, timestamp: '2025-10-13 14:45:15', user: 'Unknown Student', rfid: 'ST777777', status: 'denied', location: 'Main Gate', course: 'Unknown', yearLevel: 'Unknown' },
      { id: 10, timestamp: '2025-10-13 14:40:00', user: 'Alex Rodriguez', rfid: 'ST004567', status: 'granted', location: 'Main Gate', course: 'AHRD', yearLevel: '2nd Year' },
      { id: 11, timestamp: '2025-10-13 14:35:45', user: 'Maria Garcia', rfid: 'ST008901', status: 'granted', location: 'Main Gate', course: 'AHRT', yearLevel: '1st Year' },
      { id: 12, timestamp: '2025-10-13 14:30:30', user: 'Unknown Student', rfid: 'ST666666', status: 'denied', location: 'Main Gate', course: 'Unknown', yearLevel: 'Unknown' }
    ]
    
    this.accessLogModel.logs = mockLogs
  }

  // Data retrieval methods
  async getAllLogs() {
    return this.executeAsync(async () => {
      await this.loadAccessLogs()
      return this.accessLogModel.getAllLogs()
    })
  }

  async getFilteredLogs() {
    return this.executeAsync(async () => {
      return await this.accessLogModel.getFilteredLogs()
    })
  }

  async getPaginatedLogs() {
    return this.executeAsync(async () => {
      const filteredLogs = await this.accessLogModel.getFilteredLogs()
      const startIndex = (this.currentPage - 1) * this.logsPerPage
      const endIndex = startIndex + this.logsPerPage
      
      return {
        logs: filteredLogs.slice(startIndex, endIndex),
        totalLogs: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / this.logsPerPage),
        currentPage: this.currentPage,
        hasNextPage: endIndex < filteredLogs.length,
        hasPrevPage: this.currentPage > 1
      }
    })
  }

  // Filter operations
  setStatusFilter(status) {
    this.accessLogModel.setStatusFilter(status)
    this.currentPage = 1 // Reset to first page
    this.notifyView({ type: 'FILTERS_CHANGED' })
  }

  setSearchFilter(searchTerm) {
    this.accessLogModel.setSearchFilter(searchTerm)
    this.currentPage = 1 // Reset to first page
    this.notifyView({ type: 'FILTERS_CHANGED' })
  }

  setDateRangeFilter(startDate, endDate) {
    this.accessLogModel.setDateRangeFilter(startDate, endDate)
    this.currentPage = 1 // Reset to first page
    this.notifyView({ type: 'FILTERS_CHANGED' })
  }

  clearAllFilters() {
    this.accessLogModel.clearFilters()
    this.currentPage = 1
    this.notifyView({ type: 'FILTERS_CLEARED' })
  }

  // Pagination methods
  setCurrentPage(page) {
    this.currentPage = page
    this.notifyView({ type: 'PAGE_CHANGED', page })
  }

  nextPage() {
    this.currentPage++
    this.notifyView({ type: 'PAGE_CHANGED', page: this.currentPage })
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--
      this.notifyView({ type: 'PAGE_CHANGED', page: this.currentPage })
    }
  }

  setLogsPerPage(count) {
    this.logsPerPage = count
    this.currentPage = 1 // Reset to first page
    this.notifyView({ type: 'PAGINATION_CHANGED' })
  }

  // Analytics methods
  getAccessStats(days = 7) {
    return this.accessLogModel.getAccessStats(days)
  }

  getAccessByDay(days = 7) {
    return this.accessLogModel.getAccessByDay(days)
  }

  getTopUsers(limit = 10) {
    const logs = this.accessLogModel.logs
    const userCounts = {}
    
    logs.forEach(log => {
      if (log.status === 'granted') {
        userCounts[log.user] = (userCounts[log.user] || 0) + 1
      }
    })
    
    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([user, count]) => ({ user, count }))
  }

  getFailedAttempts(limit = 10) {
    const logs = this.accessLogModel.logs
    return logs
      .filter(log => log.status === 'denied')
      .slice(0, limit)
      .map(log => ({
        ...log,
        timeAgo: this.accessLogModel.getTimeAgo(log.timestamp)
      }))
  }

  // Export functionality
  async exportLogs(format = 'csv') {
    return this.executeAsync(async () => {
      const logs = await this.accessLogModel.getFilteredLogs()
      
      if (format === 'csv') {
        const csvContent = ExportUtils.arrayToCSV(logs, [
          'timestamp', 'user', 'rfid', 'status', 'location', 'course', 'yearLevel'
        ])
        
        // Trigger download
        ExportUtils.downloadCSV(csvContent, `access-logs-${new Date().toISOString().split('T')[0]}.csv`)
        
        return { success: true, message: 'Logs exported successfully' }
      }
      
      if (format === 'json') {
        ExportUtils.downloadJSON(logs, `access-logs-${new Date().toISOString().split('T')[0]}.json`)
        return { success: true, message: 'Logs exported successfully' }
      }
      
      return logs
    })
  }

  // Real-time updates
  addNewLog(logData) {
    this.accessLogModel.createLog(logData)
    this.notifyView({ type: 'LOG_CREATED', log: logData })
  }

  // Search functionality
  async searchLogs(query) {
    return this.executeAsync(async () => {
      const logs = await this.accessLogModel.getAllLogs()
      const searchTerm = query.toLowerCase()
      
      return logs.filter(log =>
        log.user.toLowerCase().includes(searchTerm) ||
        log.rfid.toLowerCase().includes(searchTerm) ||
        log.location.toLowerCase().includes(searchTerm) ||
        log.status.toLowerCase().includes(searchTerm)
      )
    })
  }

  // Helper method to notify view
  notifyView(data) {
    if (this.view && this.view.updateView) {
      this.view.updateView(data)
    }
  }

  // Get current filters
  getCurrentFilters() {
    return this.accessLogModel.filters
  }

  // Get summary statistics
  getSummaryStats() {
    const logs = this.accessLogModel.logs
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = logs.filter(log => log.timestamp.startsWith(today))
    
    return {
      totalLogs: logs.length,
      todayLogs: todayLogs.length,
      grantedToday: todayLogs.filter(log => log.status === 'granted').length,
      deniedToday: todayLogs.filter(log => log.status === 'denied').length,
      uniqueUsersToday: new Set(todayLogs.map(log => log.user)).size
    }
  }
}

export default AccessLogsPresenter
