import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DashboardLayout } from './layouts/DashboardLayout'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProposalEditorPage } from './pages/ProposalEditorPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { Spinner } from './components/ui/Spinner'
import { ROUTES } from './constants/routes'

function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
        </Route>

        {/* Full screen editor routes */}
        <Route path={ROUTES.PROPOSAL_NEW} element={<ProposalEditorPage />} />
        <Route path={ROUTES.PROPOSAL_EDIT} element={<ProposalEditorPage />} />
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="bottom-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}
