import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { api } from '../services/api';
import './AuthPages.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.login({ email, password });
      login(data);
      navigate('/');
    } catch (error) {
      alert('Login failed');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      // In a real app, this would send a reset email
      setForgotMessage('Password reset link sent to your email!');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 2000);
    } catch (error) {
      setForgotMessage('Error sending reset email');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-left-panel">
          <div>
            <p className="auth-kicker">Welcome</p>
            <h1 className="auth-heading">Campus Food</h1>
            <p className="auth-subtext mb-0">
              Sign in to manage your meals, plan your week, and place orders in seconds.
            </p>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-form-card">
            <h2 className="auth-form-title">Sign in</h2>
            <p className="auth-form-subtitle">Use your email and password to continue.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label auth-label">Email</label>
                <input
                  type="email"
                  className="form-control auth-input"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label auth-label">Password</label>
                <input
                  type="password"
                  className="form-control auth-input"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="auth-forgot-link-under"
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              </div>
              <button type="submit" className="btn auth-submit-btn w-100">Sign in</button>
            </form>

            <p className="auth-switch-text">
              Do not have an account? <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Reset Password</h3>
              <button
                type="button"
                className="auth-modal-close"
                onClick={() => setShowForgotModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleForgotPassword} className="auth-modal-body">
              <p className="auth-modal-text">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="mb-3">
                <label htmlFor="forgotEmail" className="form-label auth-label">Email</label>
                <input
                  type="email"
                  className="form-control auth-input"
                  id="forgotEmail"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              {forgotMessage && (
                <div className={`auth-modal-message ${forgotMessage.includes('Error') ? 'error' : 'success'}`}>
                  {forgotMessage}
                </div>
              )}
              <button type="submit" className="btn auth-submit-btn w-100">Send Reset Link</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;