import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage      from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage     from './pages/TasksPage';
import FocusPage     from './pages/FocusPage';
import './index.css';

// Protects pages from unauthenticated access
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { user, darkMode } = useAuth();

  return (
    // Apply dark/light class to root
    <div className={darkMode ? 'dark-mode' : 'light-mode'}>
      <Routes>
        <Route path="/auth" element={
          user ? <Navigate to="/dashboard" replace /> : <AuthPage />
        }/>
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        }/>
        <Route path="/tasks" element={
          <PrivateRoute><TasksPage /></PrivateRoute>
        }/>
        <Route path="/focus" element={
          <PrivateRoute><FocusPage /></PrivateRoute>
        }/>
        <Route path="*" element={
          <Navigate to={user ? '/dashboard' : '/auth'} replace />
        }/>
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}