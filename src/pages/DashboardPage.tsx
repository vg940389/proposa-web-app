import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { ROUTES } from '../constants/routes'
import { useProposals } from '../hooks/useProposals'
import { Spinner } from '../components/ui/Spinner'

export function DashboardPage() {
  const { user } = useAuth()
  const { proposals, loading, error } = useProposals()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.email}
          </p>
        </div>
        <Link to={ROUTES.PROPOSAL_NEW}>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 text-sm">
          Failed to load proposals: {error.message}
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No proposals yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first proposal to get started.
          </p>
          <div className="mt-6">
            <Link to={ROUTES.PROPOSAL_NEW}>
              <Button>Create a proposal</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/proposals/${proposal.id}`} className="block">
                      <div className="text-sm font-medium text-gray-900">{proposal.title || 'Untitled Proposal'}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/proposals/${proposal.id}`} className="block">
                      <div className="text-sm text-gray-900">{proposal.customer_name || '-'}</div>
                      <div className="text-sm text-gray-500">{proposal.customer_email || '-'}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/proposals/${proposal.id}`} className="block">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {proposal.status}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link to={`/proposals/${proposal.id}`} className="block">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
