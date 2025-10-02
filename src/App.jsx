import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import GuardDashboard from './components/GuardDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SupervisorDashboard from './components/SupervisorDashboard';
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={`/${user.role}`} />}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute role="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guard"
        element={
          <ProtectedRoute role="guard">
            <GuardDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to={user ? `/${user.role}` : "/login"} />}
      />

            <Route
        path="/supervisor"
        element={
          <ProtectedRoute role="supervisor">
            <SupervisorDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;