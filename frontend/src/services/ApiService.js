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
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
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

  // Specific API endpoints
  async getUsers() {
    return this.get('/students')
  }

  async getStudents() {
    return this.get('/students')
  }

  async createUser(userData) {
    return this.post('/students', userData)
  }

  async createStudent(studentData) {
    return this.post('/students', studentData)
  }

  async updateUser(id, userData) {
    return this.put(`/students/${id}`, userData)
  }

  async updateStudent(id, studentData) {
    return this.put(`/students/${id}`, studentData)
  }

  async deleteUser(id) {
    return this.delete(`/students/${id}`)
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
    return this.get('/system/settings')
  }

  async updateSettings(settings) {
    return this.put('/system/settings', settings)
  }

  async exportAccessLogs(format = 'csv') {
    return this.get(`/access-logs/export?format=${format}`)
  }
}

export default new ApiService()
