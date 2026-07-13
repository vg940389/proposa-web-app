import { Link } from 'react-router-dom'
import { ROUTES } from '../constants/routes'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300">404</h1>
        <p className="mt-4 text-lg text-gray-600">Page not found</p>
        <Link
          to={ROUTES.DASHBOARD}
          className="mt-6 inline-block text-blue-600 hover:text-blue-500 font-medium"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
