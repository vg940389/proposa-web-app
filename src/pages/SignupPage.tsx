import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { SignupForm } from '../components/auth/SignupForm'
import { useAuth } from '../contexts/AuthContext'
import { useEffect } from 'react'
import { ROUTES } from '../constants/routes'

export function SignupPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      navigate(ROUTES.DASHBOARD, { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  )
}
