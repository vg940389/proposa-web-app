import { useState } from "react"
import { GenerateProposalModal } from "../components/GenerateProposalModal"
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Sparkles, Inbox } from "lucide-react"
import { ROUTES } from '../constants/routes'
import { useProposals } from '../hooks/useProposals'
import { Spinner } from "@/components/ui/spinner"

export function DashboardPage() {
  const { user } = useAuth()
  const { proposals, loading, error } = useProposals()
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setIsAiModalOpen(true)}>
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            Generate with AI
          </Button>
          <Link to={ROUTES.PROPOSAL_NEW}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No proposals yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm text-center mt-1 mb-6">
              Create your first proposal manually or use our AI assistant to generate one in seconds.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setIsAiModalOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                AI Generate
              </Button>
              <Link to={ROUTES.PROPOSAL_NEW}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Manually
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b">
                <tr>
                  <th className="h-10 px-4 font-medium">Title</th>
                  <th className="h-10 px-4 font-medium">Client</th>
                  <th className="h-10 px-4 font-medium">Status</th>
                  <th className="h-10 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-muted/50 transition-colors group cursor-pointer">
                    <td className="px-4 py-3">
                      <Link to={`/proposals/${proposal.id}`} className="block font-medium text-foreground">
                        {proposal.title || 'Untitled Proposal'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/proposals/${proposal.id}`} className="block">
                        <div className="font-medium">{proposal.customer_name || '-'}</div>
                        <div className="text-muted-foreground text-xs">{proposal.customer_email || '-'}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/proposals/${proposal.id}`} className="block">
                        <Badge variant={proposal.status === 'signed' || proposal.status === 'paid' ? 'default' : proposal.status === 'sent' ? 'secondary' : 'outline'}>
                          {proposal.status}
                        </Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Link to={`/proposals/${proposal.id}`} className="block">
                        {new Date(proposal.created_at).toLocaleDateString()}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <GenerateProposalModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
    </div>
  )
}
