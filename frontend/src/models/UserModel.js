import { BaseModel, ValidationRules, validate } from './BaseModel.js'

export class UserModel extends BaseModel {
  constructor() {
    super()
    this.users = []
    this.currentUser = null
  }

  // CRUD Operations
  async getAllUsers() {
    // In real app, this would call an API
    return this.users
  }

  async getUserById(id) {
    return this.users.find(user => user.id === id)
  }

  async createUser(userData) {
    // Validate user data
    const validation = this.validateUser(userData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }

    const newUser = {
      id: Date.now(),
      ...userData,
      createdAt: new Date().toISOString(),
      lastAccess: 'Never'
    }

    this.users.push(newUser)
    this.notifyObservers({ type: 'USER_CREATED', user: newUser })
    return newUser
  }

  async updateUser(id, userData) {
    const validation = this.validateUser(userData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }

    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    this.users[userIndex] = { ...this.users[userIndex], ...userData }
    this.notifyObservers({ type: 'USER_UPDATED', user: this.users[userIndex] })
    return this.users[userIndex]
  }

  async deleteUser(id) {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const deletedUser = this.users.splice(userIndex, 1)[0]
    this.notifyObservers({ type: 'USER_DELETED', user: deletedUser })
    return deletedUser
  }

  // Business Logic
  validateUser(userData) {
    const errors = []

    if (!validate(userData.name, [ValidationRules.required])) {
      errors.push('Name is required')
    }

    if (!validate(userData.email, [ValidationRules.required, ValidationRules.email])) {
      errors.push('Valid email is required')
    }

    if (!validate(userData.rfid, [ValidationRules.required, ValidationRules.rfid])) {
      errors.push('Valid RFID format is required (e.g., RF123456)')
    }

    // Check for duplicate RFID
    const existingUser = this.users.find(user => 
      user.rfid === userData.rfid && user.id !== userData.id
    )
    if (existingUser) {
      errors.push('RFID already exists')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  getActiveUsers() {
    return this.users.filter(user => user.status === 'active')
  }

  getInactiveUsers() {
    return this.users.filter(user => user.status === 'inactive')
  }

  searchUsers(query) {
    const lowercaseQuery = query.toLowerCase()
    return this.users.filter(user =>
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery) ||
      user.rfid.toLowerCase().includes(lowercaseQuery)
    )
  }
}

export default UserModel
