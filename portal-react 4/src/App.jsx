import { HashRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LangProvider } from './context/LangContext'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
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
import NotFound from './pages/NotFound'

// HashRouter is used deliberately: GitHub Pages serves static files with
// no server-side rewrite, so a BrowserRouter route like /hosp-react/book
// would 404 on a hard refresh. Hash routes (/hosp-react/#/book) always
// resolve to index.html first, then React Router takes over client-side.
export default function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AuthProvider>
          <ToastProvider>
            <HashRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/intake" element={<ProtectedRoute><IntakeForm /></ProtectedRoute>} />
                <Route path="/book" element={<ProtectedRoute><AppointmentForm /></ProtectedRoute>} />
                <Route path="/nearest" element={<ProtectedRoute><NearestSpecialist /></ProtectedRoute>} />
                <Route path="/ask-ai" element={<ProtectedRoute><AskAI /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </ToastProvider>
        </AuthProvider>
      </LangProvider>
    </ThemeProvider>
  )
}
