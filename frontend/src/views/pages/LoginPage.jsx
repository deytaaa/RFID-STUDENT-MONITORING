import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      console.log('Login response data:', data); // DEBUG LOG
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        console.log('Saved token to localStorage:', data.token); // DEBUG LOG
        onLogin && onLogin({ user: data.user, token: data.token });
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error');
      console.log(error)
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src='/public/logo-ptc.png' alt="PTC Logo" className="login-logo" />
        <h1 className="login-title">QUACKCESS</h1>
        <p className="login-subtitle">Student Monitoring</p>
      </div>
      <div className="login-right">
        <h2 className="login-welcome">Welcome back,<br />Admin!</h2>
        <p className="login-note">*Only authorized personnel</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <span className="input-label">Email</span>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <div className="input-group">
            <span className="input-label">Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </div>
          <button type="submit" disabled={loading} className="login-btn">{loading ? 'Logging in...' : 'LOG IN'}</button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
