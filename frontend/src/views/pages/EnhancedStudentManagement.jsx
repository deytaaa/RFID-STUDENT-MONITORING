import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  Download,
  Upload,
  Filter,
  Users,
  FileText,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  MoreVertical
} from 'lucide-react'
import ApiService from '../../services/ApiService.js'
import { 
  StudentFormModal, 
  StudentViewModal, 
  BulkUpdateModal, 
  BulkImportModal 
} from '../components/StudentModals.jsx'
import { YEAR_LEVEL_OPTIONS, getCourseShortCode } from '../../utils/constants.js'
import './EnhancedStudentManagement.css'

const EnhancedStudentManagement = ({ user }) => {
  // State Management
  const [students, setStudents] = useState([])
  const [selectedStudents, setSelectedStudents] = useState([])
  const [statistics, setStatistics] = useState({
    overview: { totalStudents: 0, activeStudents: 0, inactiveStudents: 0 },
    byCourse: [],
    byYearLevel: []
  })
  
  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    course: '',
    yearLevel: '',
    isActive: '',
    accessLevel: ''
  })
  const [sortConfig, setSortConfig] = useState({ sortBy: 'name', sortOrder: 'asc' })
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  
  // UI State
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [viewingStudent, setViewingStudent] = useState(null)
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const isSuperAdmin = user && (user.role === 'superadmin' || user.accessLevel === 'superadmin');
  
  // Load students with filters and pagination
  const loadStudents = useCallback(async () => {
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
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.sortBy,
        sortOrder: sortConfig.sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.course && { course: filters.course }),
        ...(filters.yearLevel && { yearLevel: filters.yearLevel }),
        ...(filters.isActive !== '' && { isActive: filters.isActive }),
        ...(filters.accessLevel && { accessLevel: filters.accessLevel })
      })
      const response = await ApiService.get(`/students?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.success) {
        setStudents(response.data)
        setPagination(prev => ({
          ...prev,
          total: response.total,
          pages: response.pages
        }))
      }
    } catch (error) {
      setError('Failed to load students')
      console.error('Error loading students:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm, filters])
  
  // Load student statistics
  const loadStatistics = useCallback(async () => {
    // Only fetch if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated. Please log in.');
      return;
    }
    try {
      const response = await ApiService.get('/students/statistics/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.success) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }, [])
  
  // Initial load
  useEffect(() => {
    loadStudents()
    loadStatistics()
  }, [loadStudents, loadStatistics])
  
  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }
  
  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  // Debounce search input
  const searchTimeout = useRef(null);

  // Debounced search handler
  const handleSearchDebounced = (value) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const onSearchInputChange = (e) => {
    const value = e.target.value;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleSearchDebounced(value);
    }, 350);
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }
  
  // Handle sort
  const handleSort = (field) => {
    setSortConfig(prev => ({
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }
  
  // Handle student selection
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }
  
  const handleSelectAll = () => {
    setSelectedStudents(
      selectedStudents.length === students.length 
        ? [] 
        : students.map(student => student._id)
    )
  }
  
  // CRUD Operations
  const handleAddStudent = async (studentData) => {
    setActionLoading(true)
    try {
      const response = await ApiService.createStudent(studentData)
      if (response.success) {
        showNotification('Student added successfully')
        setShowAddModal(false)
        loadStudents()
        loadStatistics()
      }
    } catch (error) {
      showNotification('Failed to add student', 'error')
      console.error('Error adding student:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleEditStudent = async (studentData) => {
    setActionLoading(true)
    try {
      const response = await ApiService.updateStudent(editingStudent._id, studentData)
      if (response.success) {
        showNotification('Student updated successfully')
        setEditingStudent(null)
        loadStudents()
        loadStatistics()
      }
    } catch (error) {
      showNotification('Failed to update student', 'error')
      console.error('Error updating student:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to deactivate this student?')) return
    
    setActionLoading(true)
    try {
      const response = await ApiService.deleteStudent(studentId)
      if (response.success) {
        showNotification('Student deactivated successfully')
        loadStudents()
        loadStatistics()
      }
    } catch (error) {
      showNotification('Failed to deactivate student', 'error')
      console.error('Error deleting student:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  // Bulk Operations
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${selectedStudents.length} students?`)) return
    
    setActionLoading(true)
    try {
      const response = await ApiService.delete('/students/bulk', { studentIds: selectedStudents })
      if (response.success) {
        showNotification(`Successfully deactivated ${response.data.modifiedCount} students`)
        setSelectedStudents([])
        loadStudents()
        loadStatistics()
      }
    } catch (error) {
      showNotification('Failed to deactivate students', 'error')
      console.error('Error bulk deleting students:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  const handleBulkUpdate = async (updateData) => {
    setActionLoading(true)
    try {
      const response = await ApiService.put('/students/bulk', { 
        studentIds: selectedStudents, 
        updateData 
      })
      if (response.success) {
        showNotification(`Successfully updated ${response.data.modifiedCount} students`)
        setSelectedStudents([])
        setShowBulkModal(false)
        loadStudents()
        loadStatistics()
      }
    } catch (error) {
      showNotification('Failed to update students', 'error')
      console.error('Error bulk updating students:', error)
    } finally {
      setActionLoading(false)
    }
  }
  
  // Removed obsolete useEffect for manual tab URL update

  // Wait for user context before permission checks
  if (typeof user === 'undefined' || user === null) {
    return (
      <div className="enhanced-student-management">
        <div className="loading-container">
          <Loader className="loading-spinner" />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="enhanced-student-management">
        <div className="loading-container">
          <Loader className="loading-spinner" />
          <p>Loading students...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="enhanced-student-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-actions" style={{ marginLeft: 'auto' }}>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            disabled={!isSuperAdmin}
          >
            <Plus size={16} />
            Add Student
          </button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{statistics.overview.totalStudents}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <UserCheck size={24} />
          </div>
          <div className="stat-content">
            <h3>{statistics.overview.activeStudents}</h3>
            <p>Active Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <UserX size={24} />
          </div>
          <div className="stat-content">
            <h3>{statistics.overview.inactiveStudents}</h3>
            <p>Inactive Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon courses">
            <GraduationCap size={24} />
          </div>
          <div className="stat-content">
            <h3>{statistics.byCourse.length}</h3>
            <p>Courses</p>
          </div>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search students by name, ID, email, or course..."
            value={searchTerm}
            onChange={onSearchInputChange}
          />
        </div>
        
        <div className="filters">
          <select
            value={filters.course}
            onChange={(e) => handleFilterChange('course', e.target.value)}
          >
            <option value="">All Courses</option>
            {statistics.byCourse.map(course => (
              <option key={course._id} value={course._id}>
                {course._id} ({course.count})
              </option>
            ))}
          </select>
          
          <select
            value={filters.yearLevel}
            onChange={(e) => handleFilterChange('yearLevel', e.target.value)}
          >
            <option value="">All Year Levels</option>
            {YEAR_LEVEL_OPTIONS.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          
          <select
            value={filters.isActive}
            onChange={(e) => handleFilterChange('isActive', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedStudents.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">
            {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
          </span>
          <div className="bulk-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowBulkModal(true)}
              disabled={!isSuperAdmin}
            >
              <Edit size={16} />
              Bulk Edit
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleBulkDelete}
              disabled={actionLoading || !isSuperAdmin}
            >
              <Trash2 size={16} />
              Deactivate Selected
            </button>
          </div>
        </div>
      )}
      
      {/* Students Table */}
      <div className="table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th onClick={() => handleSort('name')} className="sortable">
                Name {sortConfig.sortBy === 'name' && (
                  <span className={`sort-indicator ${sortConfig.sortOrder}`} />
                )}
              </th>
              <th onClick={() => handleSort('studentId')} className="sortable">
                Student ID {sortConfig.sortBy === 'studentId' && (
                  <span className={`sort-indicator ${sortConfig.sortOrder}`} />
                )}
              </th>
              <th>Email</th>
              <th onClick={() => handleSort('course')} className="sortable">
                Course {sortConfig.sortBy === 'course' && (
                  <span className={`sort-indicator ${sortConfig.sortOrder}`} />
                )}
              </th>
              <th>Year Level</th>
              <th>RFID Tag</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.filter(student => student.accessLevel === 'student').map(student => (
              <tr key={student._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => handleSelectStudent(student._id)}
                  />
                </td>
                <td>
                  <div className="student-name">
                    <span className="name">{student.name}</span>
                  </div>
                </td>
                <td>
                  <code className="student-id">{student.studentId}</code>
                </td>
                <td>{student.email}</td>
                <td>
                  <span className="course-badge" title={student.course}>
                    {getCourseShortCode(student.course)}
                  </span>
                </td>
                <td>{student.yearLevel}</td>
                <td>
                  {student.rfIdTag ? (
                    <code className="rfid-tag">{student.rfIdTag}</code>
                  ) : (
                    <span className="no-rfid">No RFID</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${student.isActive ? 'active' : 'inactive'}`}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setViewingStudent(student)
                        setShowViewModal(true)
                      }}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => setEditingStudent(student)}
                      title="Edit Student"
                      disabled={!isSuperAdmin}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteStudent(student._id)}
                      title="Deactivate Student"
                      disabled={actionLoading || !isSuperAdmin}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && !loading && (
          <div className="empty-state">
            <Users size={48} />
            <h3>No students found</h3>
            <p>Try adjusting your search or filters, or add a new student.</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => handlePageChange(pagination.page - 1)}
          >
            Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={pageNum === pagination.page ? 'active' : ''}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => handlePageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
      
      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <div className="notification-content">
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Add/Edit Student Modal */}
      <StudentFormModal
        isOpen={showAddModal || editingStudent !== null}
        onClose={() => {
          setShowAddModal(false)
          setEditingStudent(null)
        }}
        onSubmit={editingStudent ? handleEditStudent : handleAddStudent}
        student={editingStudent}
        loading={actionLoading}
        disabled={!isSuperAdmin}
      />

      {/* View Student Modal */}
      <StudentViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false)
          setViewingStudent(null)
        }}
        student={viewingStudent}
      />

      {/* Bulk Update Modal */}
      <BulkUpdateModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSubmit={handleBulkUpdate}
        selectedCount={selectedStudents.length}
        loading={actionLoading}
        disabled={!isSuperAdmin}
      />

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={false} // Will be implemented with import functionality
        onClose={() => {}}
        onImport={() => {}}
        loading={actionLoading}
      />

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Superadmin Notice */}
      {!isSuperAdmin && (
        <div className="superadmin-notice">
          <AlertCircle size={20} />
          <span>You do not have permission to access some features. Please contact an admin.</span>
        </div>
      )}
    </div>
  )
}

export default EnhancedStudentManagement
