import React, { useEffect, useState, useRef } from 'react';
import './UserManagement.css';

const Spinner = () => (
  <div className="um-spinner" aria-label="Loading" role="status">
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" stroke="#2563eb" strokeWidth="4" opacity="0.2" />
      <path d="M16 2a14 14 0 1 1-14 14" stroke="#2563eb" strokeWidth="4" />
    </svg>
  </div>
);

const UserManagement = ({ user }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [editAdmin, setEditAdmin] = useState(null);
  const [deactivateAdmin, setDeactivateAdmin] = useState(null);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState('all');
  const notificationRef = useRef();
  const isSuperAdmin = user && (user.role === 'superadmin' || user.accessLevel === 'superadmin');

  useEffect(() => {
    if (isSuperAdmin) {
      fetch('http://localhost:3000/api/users?role=admin', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          setUsers(data.data || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isSuperAdmin, notification]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setNotification(null);
    try {
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          accessLevel: 'admin',
          role: 'admin',
          rfIdTag: `ADMIN${Date.now()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Admin created successfully.' });
        setShowCreateModal(false);
        setNewAdmin({ name: '', email: '', password: '' });
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to create admin.' });
        console.error('Create admin error:', data);
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to create admin.' });
      console.error('Create admin network error:', err);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    setNotification(null);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${editAdmin._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editAdmin.name,
          email: editAdmin.email,
          password: editAdmin.password || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Admin updated successfully.' });
        setShowEditModal(false);
        setEditAdmin(null);
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to update admin.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to update admin.' });
    }
  };

  const handleDeactivateAdmin = async () => {
    setNotification(null);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${deactivateAdmin._id}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', message: 'Admin deactivated.' });
        setShowDeactivateModal(false);
        setDeactivateAdmin(null);
      } else {
        setNotification({ type: 'error', message: data.message || 'Failed to deactivate admin.' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to deactivate admin.' });
    }
  };

  // Notification dismiss
  const dismissNotification = () => setNotification(null);

  // Modal accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (showCreateModal) setShowCreateModal(false);
        if (showEditModal) { setShowEditModal(false); setEditAdmin(null); }
        if (showDeactivateModal) { setShowDeactivateModal(false); setDeactivateAdmin(null); }
      }
    };
    if (showCreateModal || showEditModal || showDeactivateModal) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [showCreateModal, showEditModal, showDeactivateModal]);

  if (!isSuperAdmin) {
    return (
      <div className="um-access-denied">
        <span className="um-access-icon">🚫</span>
        <span>Access Denied: Only super admins can manage admin accounts.</span>
      </div>
    );
  }

  return (
    <div className="um-page">
      <div className="um-header-card">
        <button className="um-btn um-btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Admin
        </button>
      </div>
      {notification && (
        <div ref={notificationRef} className={`um-notification um-notification-${notification.type}`} role="alert" aria-live="assertive">
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
          <button onClick={dismissNotification} aria-label="Dismiss notification">×</button>
        </div>
      )}
      {/* Search/filter input */}
      <div className="um-search">
        <input
          type="text"
          placeholder="Search admins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search admins"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="um-status-select"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {/* ...existing modals, add .um-modal-close button for accessibility... */}
      {showCreateModal && (
        <div className="um-modal">
          <div className="um-modal-content" tabIndex="-1">
            <button className="um-modal-close" onClick={() => setShowCreateModal(false)} aria-label="Close modal">×</button>
            <h2>Create Admin</h2>
            <form onSubmit={handleCreateAdmin}>
              <div className="um-form-group">
                <label>Name:</label>
                <input type="text" value={newAdmin.name} onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} required />
              </div>
              <div className="um-form-group">
                <label>Email:</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
              </div>
              <div className="um-form-group">
                <label>Password:</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} required />
              </div>
              <div className="um-modal-actions">
                <button type="submit" className="um-btn um-btn-primary">Create</button>
                <button type="button" className="um-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showEditModal && editAdmin && (
        <div className="um-modal">
          <div className="um-modal-content" tabIndex="-1">
            <button className="um-modal-close" onClick={() => { setShowEditModal(false); setEditAdmin(null); }} aria-label="Close modal">×</button>
            <h2>Edit Admin</h2>
            <form onSubmit={handleEditAdmin}>
              <div className="um-form-group">
                <label>Name:</label>
                <input type="text" value={editAdmin.name} onChange={e => setEditAdmin({ ...editAdmin, name: e.target.value })} required />
              </div>
              <div className="um-form-group">
                <label>Email:</label>
                <input type="email" value={editAdmin.email} onChange={e => setEditAdmin({ ...editAdmin, email: e.target.value })} required />
              </div>
              <div className="um-form-group">
                <label>New Password:</label>
                <input type="password" value={editAdmin.password || ''} onChange={e => setEditAdmin({ ...editAdmin, password: e.target.value })} placeholder="Leave blank to keep current password" />
              </div>
              <div className="um-modal-actions">
                <button type="submit" className="um-btn um-btn-primary">Save</button>
                <button type="button" className="um-btn" onClick={() => { setShowEditModal(false); setEditAdmin(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeactivateModal && deactivateAdmin && (
        <div className="um-modal">
          <div className="um-modal-content" tabIndex="-1">
            <button className="um-modal-close" onClick={() => { setShowDeactivateModal(false); setDeactivateAdmin(null); }} aria-label="Close modal">×</button>
            <h2>Deactivate Admin</h2>
            <p>Are you sure you want to deactivate <b>{deactivateAdmin.name}</b>?</p>
            <div className="um-modal-actions">
              <button className="um-btn um-btn-danger" onClick={handleDeactivateAdmin}>Deactivate</button>
              <button className="um-btn" onClick={() => { setShowDeactivateModal(false); setDeactivateAdmin(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="um-table-card">
        {loading ? (
          <Spinner />
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u =>
                u.accessLevel === 'admin' &&
                (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
                (statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive))
              ).map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`um-role-badge ${u.accessLevel}`}>{u.accessLevel}</span></td>
                  <td><span className={`um-status-badge ${u.isActive ? 'active' : 'inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className="um-btn um-btn-small" onClick={() => { setEditAdmin(u); setShowEditModal(true); }}>Edit</button>
                    <button className="um-btn um-btn-small um-btn-danger" onClick={() => { setDeactivateAdmin(u); setShowDeactivateModal(true); }}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
