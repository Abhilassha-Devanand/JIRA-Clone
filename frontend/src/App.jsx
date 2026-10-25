import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkspaceDashboard from './pages/WorkspaceDashboard';
import ProjectDetails from './pages/ProjectDetails';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <div className="app-container">
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main className="main-content">
                      <WorkspaceDashboard />
                    </main>
                    <footer style={{
                      marginTop: 'auto',
                      borderTop: '1px solid var(--border-subtle)',
                      padding: '1.5rem 2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                    }}>
                      PlanPulse &bull; Project & Task Workspace Management &bull; Individual Full-Stack MERN Development
                    </footer>
                  </ProtectedRoute>
                }
              />

              {/* Protected Project Routes */}
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <main className="main-content">
                      <ProjectDetails />
                    </main>
                    <footer style={{
                      marginTop: 'auto',
                      borderTop: '1px solid var(--border-subtle)',
                      padding: '1.5rem 2rem',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8125rem',
                    }}>
                      PlanPulse &bull; Project & Task Workspace Management &bull; Individual Full-Stack MERN Development
                    </footer>
                  </ProtectedRoute>
                }
              />

              {/* Fallback Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
