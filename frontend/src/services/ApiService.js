// API Service for handling HTTP requests
class ApiService {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL
    this.headers = {
      'Content-Type': 'application/json'
    }
  }

  setAuthToken(token) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`
    } else {
      delete this.headers['Authorization']
    }
  }

  async request(method, endpoint, data = null, customConfig = {}) {
    const url = `${this.baseURL}${endpoint}`;
    // Always get token from localStorage for every request
    const token = localStorage.getItem('token');
    console.log('Token used for API request:', token); // DEBUG LOG
    const headers = {
      ...this.headers,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const config = {
      method,
      headers,
      ...customConfig
    };
    if (data) {
      config.body = JSON.stringify(data);
    }
    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        // Try to get error message from response body
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData = null;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If JSON parsing fails, use default error message
          }
        }
        
        // Create a custom error with response data for specific cases
        const error = new Error(errorMessage);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: errorData
        };
        throw error;
      }
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error(`API Request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint) {
    return this.request('GET', endpoint)
  }

  async post(endpoint, data) {
    return this.request('POST', endpoint, data)
  }

  async put(endpoint, data) {
    return this.request('PUT', endpoint, data)
  }

  async delete(endpoint) {
    return this.request('DELETE', endpoint)
  }

  // Student API endpoints
  async getStudents(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    return this.get(`/students${queryParams ? `?${queryParams}` : ''}`)
  }

  async createStudent(studentData) {
    return this.post('/students', studentData)
  }

  async updateStudent(id, studentData) {
    return this.put(`/students/${id}`, studentData)
  }

  async deleteStudent(id) {
    return this.delete(`/students/${id}`)
  }

  async getAccessLogs(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    return this.get(`/access-logs${queryParams ? `?${queryParams}` : ''}`)
  }

  async getSystemStatus() {
    return this.get('/system/status')
  }

  async controlGate(action) {
    return this.post('/system/gate', { action })
  }

  async getSettings() {
    return this.get('/settings')
  }

  async updateSettings(settings) {
    return this.put('/settings', settings)
  }

  async exportAccessLogs(format = 'csv') {
    return this.get(`/access-logs/export?format=${format}`)
  }

  // User management API endpoints
  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString()
    return this.get(`/users${queryParams ? `?${queryParams}` : ''}`)
  }

  async createUser(userData) {
    return this.post('/users', userData)
  }

  async updateUser(id, userData) {
    return this.put(`/users/${id}`, userData)
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`)
  }

  async getNotifications() {
    return this.get('/notifications')
  }

  async markNotificationAsRead(id) {
    return this.put(`/notifications/${id}/read`, {})
  }

  // Profile picture upload
  async uploadProfilePicture(userId, formData) {
    const url = `${this.baseURL}/profile-picture/${userId}/upload-profile-picture`;
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData // FormData object, don't set Content-Type
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export default new ApiService()
