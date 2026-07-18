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
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            Proposals
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome back, <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => setIsAiModalOpen(true)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 hover:text-amber-800 border-none">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
          <Link to={ROUTES.PROPOSAL_NEW}>
            <Button className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-md transition-all hover:shadow-lg">
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
        <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="p-5 bg-white shadow-sm rounded-full mb-6 border border-primary/10">
              <Inbox className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">No proposals yet</h3>
            <p className="text-muted-foreground text-base max-w-sm text-center mt-2 mb-8">
              Create your first proposal manually or use our AI assistant to generate one in seconds.
            </p>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setIsAiModalOpen(true)} className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800">
                <Sparkles className="w-4 h-4 mr-2" />
                AI Generate
              </Button>
              <Link to={ROUTES.PROPOSAL_NEW}>
                <Button className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-md">
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
