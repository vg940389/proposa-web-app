import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ROUTES } from '../../constants/routes'

export function SignupForm() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Create account</h2>

      {success ? (
        <div className="p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
          <h3 className="font-medium mb-1">Account created successfully!</h3>
          <p className="text-sm">
            Please check your email to confirm your account, or{' '}
            <Link to={ROUTES.LOGIN} className="font-medium underline hover:text-green-900">
              sign in
            </Link>{' '}
            if email confirmation is disabled.
          </p>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-sm text-red-600">{error}</div>
          )}
          <div className="space-y-2">
        <Label htmlFor="text-input">Full name</Label>
        <Input
          id="text-input"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
          <div className="space-y-2">
        <Label htmlFor="email-input">Email</Label>
        <Input
          id="email-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
          <div className="space-y-2">
        <Label htmlFor="password-input">Password</Label>
        <Input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
        />
      </div>
          <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Create account
          </Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-blue-600 hover:text-blue-500 font-medium">
              Sign in
            </Link>
          </p>
        </>
      )}
    </form>
  )
}
