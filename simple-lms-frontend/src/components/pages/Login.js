import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiLogin } from '../../utils/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveCurrent, saveToken } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Enter email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiLogin(email, password);
      const { token, id, role, name } = response.data;

      saveToken(token);
      saveCurrent({ id, name, email, role });
      navigate('/catalog');
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="login-grid">
        <div className="login-left">
          <h1 className="hero-title">Simple<span className="accent">LMS</span></h1>
          <p className="muted">LMS — enter email & password to sign in.</p>
        </div>

        <div className="login-right">
          <h2>Login</h2>
          <form onSubmit={handleSubmit} className="form" autoComplete="off">
            <label className="label">Email</label>
            <input
              type="email"
              placeholder="enter your mail id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
            <label className="label">Password</label>
            <input
              type="password"
              placeholder="enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
            <div style={{ marginTop: '12px' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

export default Login;
