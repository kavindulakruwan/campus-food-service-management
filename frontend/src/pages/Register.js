import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { api } from '../services/api';
import './AuthPages.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.register({ name, email, password });
      login(data);
      navigate('/');
    } catch (error) {
      alert('Registration failed');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-left-panel">
          <div>
            <p className="auth-kicker">Get Started</p>
            <h1 className="auth-heading">Create Account</h1>
            <p className="auth-subtext mb-0">
              Join Campus Food and unlock quick meal ordering, favorites, and personalized plans.
            </p>
          </div>
        </div>

        <div className="auth-right-panel">
          <div className="auth-form-card">
            <h2 className="auth-form-title">Register</h2>
            <p className="auth-form-subtitle">Create your profile to continue.</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label auth-label">Full Name</label>
                <input
                  type="text"
                  className="form-control auth-input"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
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
                  placeholder="Create password"
                  required
                />
              </div>
              <button type="submit" className="btn auth-submit-btn w-100">Create Account</button>
            </form>

            <p className="auth-switch-text">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;