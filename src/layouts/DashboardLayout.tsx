import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from '../constants/routes'
import { cn } from '../lib/utils'

export function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <NavLink to={ROUTES.DASHBOARD} className="text-xl font-bold text-gray-900">
              ProposalApp
            </NavLink>
            <nav className="flex items-center gap-6">
              <NavLink
                to={ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  cn('text-sm font-medium', isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700')
                }
              >
                Dashboard
              </NavLink>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
