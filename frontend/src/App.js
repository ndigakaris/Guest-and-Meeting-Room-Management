import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from './components/ui/sonner';
import { Login } from './pages/Login';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { RoomManagement } from './pages/admin/RoomManagement';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { BookRoom } from './pages/employee/BookRoom';
import { GuestManagement } from './pages/employee/GuestManagement';
import { AIChat } from './pages/employee/AIChat';

// Receptionist Pages
import { ReceptionistDashboard } from './pages/receptionist/ReceptionistDashboard';
import { GuestCheckIn } from './pages/receptionist/GuestCheckIn';
import { GuestCheckOut } from './pages/receptionist/GuestCheckOut';

import './App.css';

const RootRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'employee') return <Navigate to="/employee/dashboard" replace />;
  if (user.role === 'receptionist') return <Navigate to="/receptionist/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RoomManagement />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/book"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <BookRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/bookings"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/guests"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <GuestManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/ai-chat"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin']}>
                <AIChat />
              </ProtectedRoute>
            }
          />

          {/* Receptionist Routes */}
          <Route
            path="/receptionist/dashboard"
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/check-in"
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <GuestCheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/check-out"
            element={
              <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                <GuestCheckOut />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
