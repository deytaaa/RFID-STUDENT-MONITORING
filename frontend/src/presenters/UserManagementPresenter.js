import { BasePresenter } from './BasePresenter.js'
import UserModel from '../models/UserModel.js'
import ApiService from '../services/ApiService.js'

export class UserManagementPresenter extends BasePresenter {
  constructor() {
    super()
    this.userModel = new UserModel()
    this.searchTerm = ''
    this.filters = {}
    
    // Initialize with real data from backend
    this.initializeData()
  }

  async initializeData() {
    try {
      await this.loadUsers()
    } catch (error) {
      console.warn('Failed to load data from backend, using fallback data:', error)
      this.initializeMockData()
    }
  }

  async loadUsers() {
    try {
      const response = await ApiService.getUsers()
      if (response.success && response.data) {
        this.userModel.users = response.data.map(user => ({
          id: user._id,
          name: user.name || user.email,
          rfid: user.rfidTag || 'Not Set',
          email: user.email,
          role: user.accessLevel || 'student',
          course: user.course || 'Not Set',
          yearLevel: user.yearLevel || 'Not Set',
          status: user.isActive ? 'active' : 'inactive',
          lastAccess: user.lastAccess ? new Date(user.lastAccess).toLocaleString() : 'Never',
          studentId: user.studentId || 'Not Set'
        }))
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      throw error
    }
  }

  initializeMockData() {
    const mockUsers = [
      { id: 1, name: 'Manuel Data', rfid: 'ST001234', email: 'manuel.data@college.edu', role: 'Student', course: 'Bachelor of Science Information Technology (BSIT)', yearLevel: '3rd Year', status: 'active', lastAccess: '2025-10-13 15:30:25', studentId: '202301234' },
      { id: 2, name: 'Jane Smith', rfid: 'ST005678', email: 'jane.smith@college.edu', role: 'Student', course: 'Certificate in Computer Sciences (CCS)', yearLevel: '1st Year', status: 'active', lastAccess: '2025-10-13 15:25:10', studentId: '202305678' },
      { id: 3, name: 'Mike Johnson', rfid: 'ST003456', email: 'mike.johnson@college.edu', role: 'Student', course: 'Bachelor of Science in Office Administration (BSOA)', yearLevel: '4th Year', status: 'active', lastAccess: '2025-10-13 15:15:30', studentId: '202003456' },
      { id: 4, name: 'Sarah Wilson', rfid: 'ST007890', email: 'sarah.wilson@college.edu', role: 'Student', course: 'Certificate in Office Administration (COA)', yearLevel: '2nd Year', status: 'active', lastAccess: '2025-10-13 15:10:15', studentId: '202207890' },
      { id: 5, name: 'David Brown', rfid: 'ST002345', email: 'david.brown@college.edu', role: 'Student', course: 'Associate in Business Administration (ABA)', yearLevel: '2nd Year', status: 'inactive', lastAccess: '2025-10-12 14:55:45', studentId: '202202345' },
      { id: 6, name: 'Emily Davis', rfid: 'ST006789', email: 'emily.davis@college.edu', role: 'Student', course: 'Associate in Accounting Information System (AAIS)', yearLevel: '1st Year', status: 'active', lastAccess: '2025-10-13 14:50:30', studentId: '202306789' },
      { id: 7, name: 'Alex Rodriguez', rfid: 'ST004567', email: 'alex.rodriguez@college.edu', role: 'Student', course: 'Associate in Human Resource Development (AHRD)', yearLevel: '2nd Year', status: 'active', lastAccess: '2025-10-13 14:45:15', studentId: '202204567' },
      { id: 8, name: 'Maria Garcia', rfid: 'ST008901', email: 'maria.garcia@college.edu', role: 'Student', course: 'Associate in Hotel and Restaurant Technology (AHRT)', yearLevel: '1st Year', status: 'active', lastAccess: '2025-10-13 14:40:20', studentId: '202308901' },
    ]
    
    this.userModel.users = mockUsers
  }

  // User CRUD operations
  async getAllUsers() {
    return this.executeAsync(async () => {
      await this.loadUsers()
      return this.userModel.getAllUsers()
    })
  }

  async getFilteredUsers() {
    return this.executeAsync(async () => {
      let users = await this.userModel.getAllUsers()
      
      // Apply search filter
      if (this.searchTerm) {
        users = this.userModel.searchUsers(this.searchTerm)
      }
      
      // Apply other filters
      Object.entries(this.filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          users = users.filter(user => user[key] === value)
        }
      })
      
      return users
    })
  }

  async createUser(userData) {
    return this.executeAsync(async () => {
      // In a real app, call API
      // const user = await ApiService.createUser(userData)
      const user = await this.userModel.createUser(userData)
      
      this.notifyView({ type: 'USER_CREATED', user })
      return user
    })
  }

  async updateUser(id, userData) {
    return this.executeAsync(async () => {
      // In a real app, call API
      // const user = await ApiService.updateUser(id, userData)
      const user = await this.userModel.updateUser(id, userData)
      
      this.notifyView({ type: 'USER_UPDATED', user })
      return user
    })
  }

  async deleteUser(id) {
    return this.executeAsync(async () => {
      // In a real app, call API
      // await ApiService.deleteUser(id)
      const user = await this.userModel.deleteUser(id)
      
      this.notifyView({ type: 'USER_DELETED', user })
      return user
    })
  }

  async toggleUserStatus(id) {
    return this.executeAsync(async () => {
      const user = await this.userModel.getUserById(id)
      if (!user) {
        throw new Error('User not found')
      }
      
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      return await this.updateUser(id, { status: newStatus })
    })
  }

  // Search and filter operations
  setSearchTerm(searchTerm) {
    this.searchTerm = searchTerm
    this.notifyView({ type: 'SEARCH_CHANGED', searchTerm })
  }

  setFilter(key, value) {
    this.filters[key] = value
    this.notifyView({ type: 'FILTER_CHANGED', key, value })
  }

  clearFilters() {
    this.searchTerm = ''
    this.filters = {}
    this.notifyView({ type: 'FILTERS_CLEARED' })
  }

  // Statistics
  getUserStats() {
    const users = this.userModel.users
    return {
      total: users.length,
      active: this.userModel.getActiveUsers().length,
      inactive: this.userModel.getInactiveUsers().length,
      bsit: users.filter(u => u.course && u.course.includes('BSIT')).length,
      ccs: users.filter(u => u.course && u.course.includes('CCS')).length,
      bsoa: users.filter(u => u.course && u.course.includes('BSOA')).length,
      coa: users.filter(u => u.course && u.course.includes('COA')).length,
      aba: users.filter(u => u.course && u.course.includes('ABA')).length,
      aais: users.filter(u => u.course && u.course.includes('AAIS')).length,
      ahrd: users.filter(u => u.course && u.course.includes('AHRD')).length,
      ahrt: users.filter(u => u.course && u.course.includes('AHRT')).length
    }
  }

  // Validation
  validateUser(userData) {
    return this.userModel.validateUser(userData)
  }

  // Helper method to notify view
  notifyView(data) {
    if (this.view && this.view.updateView) {
      this.view.updateView(data)
    }
  }

  // Export functionality
  async exportUsers(format = 'csv') {
    return this.executeAsync(async () => {
      const users = await this.userModel.getAllUsers()
      
      if (format === 'csv') {
        const headers = ['Name', 'Email', 'ID Card', 'Course', 'Year Level', 'Student ID', 'Status', 'Last Access']
        const csvData = users.map(user => [
          user.name,
          user.email,
          user.rfid,
          user.course || '',
          user.yearLevel || '',
          user.studentId || '',
          user.status,
          user.lastAccess
        ])
        
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => row.join(','))
        ].join('\n')
        
        return csvContent
      }
      
      return users
    })
  }
}

export default UserManagementPresenter
