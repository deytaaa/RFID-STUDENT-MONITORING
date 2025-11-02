import React, { useState } from 'react';

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
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Admin Login</h2>
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>
        <button type="submit" disabled={loading} className="login-btn">{loading ? 'Logging in...' : 'Login'}</button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default LoginPage;
