import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);

  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: '▦'  },
    { path: '/tasks',     label: 'Tasks',     icon: '▤'  },
    { path: '/focus',     label: 'Focus',     icon: '◎'  },
  ];

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Logo */}
        <div className="nav-logo" onClick={() => navigate('/dashboard')}>
          <span className="logo-mark">◈</span>
          <span className="logo-text">Taskify</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="nav-links">
          {links.map(({ path, label, icon }) => (
            <button
              key={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Right side controls */}
        <div className="nav-right">

          {/* Dark mode toggle */}
          <button className="dark-toggle" onClick={toggleDark} title="Toggle theme">
            {darkMode ? '☀' : '☾'}
          </button>

          {/* User avatar + name */}
          <div className="nav-user-info">
            <div className="nav-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="nav-username">{user?.name?.split(' ')[0]}</span>
          </div>

          {/* Logout */}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⏻
          </button>

          {/* Mobile menu button */}
          <button className="hamburger" onClick={() => setOpen(!open)}>
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobile-nav">
          {links.map(({ path, label, icon }) => (
            <button key={path} className="mobile-link"
              onClick={() => { navigate(path); setOpen(false); }}>
              {icon} {label}
            </button>
          ))}
          <button className="mobile-link" onClick={toggleDark}>
            {darkMode ? '☀ Light Mode' : '☾ Dark Mode'}
          </button>
          <button className="mobile-link danger" onClick={handleLogout}>
            ⏻ Logout
          </button>
        </div>
      )}
    </nav>
  );
}