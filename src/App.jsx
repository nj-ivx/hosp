import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'

import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import IntakeForm from './pages/IntakeForm'
import AppointmentForm from './pages/AppointmentForm'
import NearestSpecialist from './pages/NearestSpecialist'
import AskAI from './pages/AskAI'
import AdminUsers from './pages/AdminUsers'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <HashRouter>
              <div className="ambient-bg">
                <div className="ambient-orb-1" />
                <div className="ambient-orb-2" />
              </div>

              <div className="app-container">
                <Nav />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Role Protected Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/intake"
                      element={
                        <ProtectedRoute allowedRoles={['user', 'admin']}>
                          <IntakeForm />
                        </ProtectedRoute>
                      }
                    />

                    <Route
                      path="/book"
                      element={
                        <ProtectedRoute allowedRoles={['user', 'admin']}>
                          <AppointmentForm />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="/nearest" element={<NearestSpecialist />} />
                    <Route path="/ask-ai" element={<AskAI />} />

                    <Route
                      path="/admin/users"
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminUsers />
                        </ProtectedRoute>
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </HashRouter>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
