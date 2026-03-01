import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailsPage from './pages/TeamDetailsPage';
import RulesPage from './pages/RulesPage';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/App.css';
import './styles/theme.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clocking" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute requireManager><TeamsPage /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute requireManager><TeamDetailsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requireManager><UsersPage /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute requireManager><RulesPage /></ProtectedRoute>} />
        <Route path="/home" element={<Navigate to="/clocking" replace />} />
        <Route path="/data" element={<Navigate to="/dashboard" replace />} />
        <Route path="/profile" element={<ProtectedRoute requireManager><Profile /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
