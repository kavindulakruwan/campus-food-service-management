import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const preferredDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (preferredDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  useEffect(() => {
    const shouldUseSideNav = !!user;
    document.body.classList.toggle('has-side-nav', !!shouldUseSideNav);
    return () => {
      document.body.classList.remove('has-side-nav');
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const profileInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';
  const profileRole = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  if (user) {
    return (
      <aside className="side-navbar">
        <Link className="app-brand side-brand" to="/meals">
          <span className="brand-mark">CF</span>
          <span className="brand-text-wrap">
            <span className="brand-title">Campus Food</span>
            <span className="brand-subtitle">Smart Meal Hub</span>
          </span>
        </Link>

        <nav className="side-nav-links">
          <NavLink className="side-nav-link" to="/meals">Home (Meals)</NavLink>
          {user.role === 'admin' && (
            <NavLink className="side-nav-link" to="/admin">Admin Dashboard</NavLink>
          )}
          <NavLink className="side-nav-link" to="/meal-planning">Meal Planning</NavLink>
          <NavLink className="side-nav-link" to="/order">Order</NavLink>
          <NavLink className="side-nav-link" to="/payment">Payment</NavLink>
          <NavLink className="side-nav-link" to="/favourite">Favourite</NavLink>
          <NavLink className="side-nav-link" to="/profile">Profile</NavLink>
        </nav>

        <div className="side-profile-card">
          <div className="side-profile-avatar">{profileInitial}</div>
          <div className="side-profile-meta">
            <div className="side-profile-name">{user?.name || 'User'}</div>
            <div className="side-profile-role">{profileRole}</div>
          </div>
        </div>

        <div className="side-nav-footer">
          <button
            type="button"
            className="btn theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button className="btn app-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg app-navbar">
      <div className="container">
        <Link className="navbar-brand app-brand" to="/">
          <span className="brand-mark">CF</span>
          <span className="brand-text-wrap">
            <span className="brand-title">Campus Food</span>
            <span className="brand-subtitle">Smart Meal Hub</span>
          </span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto app-nav-links">
            {user && user.role === 'admin' && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/admin">Admin Dashboard</NavLink>
              </li>
            )}
          </ul>
          <ul className="navbar-nav app-nav-actions">
            <li className="nav-item d-flex align-items-center">
              <button
                type="button"
                className="btn theme-toggle-btn"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? '☀' : '🌙'}
              </button>
            </li>
            {user ? (
              <li className="nav-item">
                <button className="btn app-logout-btn" onClick={handleLogout}>Logout</button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/register">Register</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;