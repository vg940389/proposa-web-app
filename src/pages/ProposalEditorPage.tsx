import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProposalEditor, ProposalEditorProvider } from '../contexts/ProposalEditorContext'
import { useProposal } from '../hooks/useProposal'
import { supabase } from '../lib/supabase'
import { ROUTES } from '../constants/routes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { generateId } from '../lib/utils'
import { BlockRenderer } from '../components/editor/BlockRenderer'
import { ArrowLeft, ArrowUp, ArrowDown, X, Plus, Send } from 'lucide-react'
import { ShareProposalModal } from '../components/ShareProposalModal'

function EditorContent() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === undefined || id === 'new'
  const { user } = useAuth()
  const navigate = useNavigate()

  const { proposal: initialProposal, loading: loadingInitial } = useProposal(isNew ? undefined : id)
  const { proposal, isSaving, hasUnsavedChanges, dispatch } = useProposalEditor()
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    if (!isNew && initialProposal) {
      dispatch({ type: 'SET_PROPOSAL', payload: initialProposal })
    } else if (isNew) {
      dispatch({
        type: 'SET_PROPOSAL',
        payload: {
          title: 'Untitled Proposal',
          status: 'draft',
          sections: [],
          customer_name: '',
          customer_email: '',
          public_token: generateId(),
        }
      })
    }
  }, [isNew, initialProposal, dispatch])

  const handleSave = async () => {
    if (!user) return

    dispatch({ type: 'SET_SAVING', payload: true })

    try {
      if (isNew) {
        const anySupabase = supabase as any
        const { data, error } = await anySupabase
          .from('proposals')
          .insert({
            title: proposal.title,
            customer_name: proposal.customer_name,
            customer_email: proposal.customer_email,
            status: proposal.status,
            sections: proposal.sections,
            public_token: proposal.public_token || generateId(),
            created_by: user.id,
          })
          .select()
          .single()

        if (error) throw error
        dispatch({ type: 'SAVED' })
        navigate(`/proposals/${data.id}`, { replace: true })
      } else {
        const anySupabase = supabase as any
        const { error } = await anySupabase
          .from('proposals')
          .update({
            title: proposal.title,
            customer_name: proposal.customer_name,
            customer_email: proposal.customer_email,
            status: proposal.status,
            sections: proposal.sections,
          })
          .eq('id', id)

        if (error) throw error
        dispatch({ type: 'SAVED' })
      }
    } catch (err) {
      console.error('Error saving proposal:', err)
      dispatch({ type: 'SET_SAVING', payload: false })
      alert('Failed to save proposal')
    }
  }

  if (loadingInitial && !isNew) {
    return <div className="p-8">Loading proposal...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-gray-500 hover:text-primary hover:bg-primary/10 -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Input
            type="text"
            value={proposal.title || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { title: e.target.value } })}
            className="text-xl font-extrabold bg-transparent border-none focus-visible:ring-0 px-0 h-auto shadow-none w-80 text-foreground placeholder-gray-400"
            placeholder="Proposal Title"
          />
          {hasUnsavedChanges && <span className="text-sm text-amber-500 font-medium">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="hover:bg-primary/10 hover:text-primary transition-colors">Preview</Button>
          <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges} className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-md">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {!isNew && (
            <Button
              onClick={() => setIsShareModalOpen(true)}
              variant="outline"
              className="border-primary/20 hover:bg-primary/5 text-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          )}
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor sidebar / Metadata */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="bg-primary/10 p-1 rounded">Details</span>
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80 font-medium">Client Name</Label>
              <Input
                type="text"
                value={proposal.customer_name || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { customer_name: e.target.value } })}
                placeholder="Acme Corp"
                className="focus-visible:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 font-medium">Client Email</Label>
              <Input
                type="email"
                value={proposal.customer_email || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { customer_email: e.target.value } })}
                placeholder="client@acme.com"
                className="focus-visible:ring-primary/50"
              />
            </div>
          </div>

          <h2 className="text-sm font-bold text-primary uppercase tracking-wider mt-8 mb-4 flex items-center gap-2">
            <span className="bg-primary/10 p-1 rounded">Add Blocks</span>
          </h2>
          <div className="space-y-2">
            {[
              { type: 'cover', label: 'Cover Page' },
              { type: 'rich_text', label: 'Text Block' },
              { type: 'pricing_table', label: 'Pricing Table' },
              { type: 'signature_block', label: 'Signature' }
            ].map((blockType) => (
              <Button
                key={blockType.type}
                variant="outline"
                className="w-full justify-start text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/20 transition-all"
                onClick={() => dispatch({ type: 'ADD_BLOCK', payload: { type: blockType.type as any, data: {} } })}
              >
                <Plus className="w-4 h-4 mr-2" />
                {blockType.label}
              </Button>
            ))}
          </div>
        </aside>

        {/* Document canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6 pb-32">
            {(!proposal.sections || proposal.sections.length === 0) ? (
              <Card className="border-dashed border-2 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5">
                <CardContent className="py-32 text-center">
                  <div className="p-4 bg-white shadow-sm rounded-full mb-4 border border-primary/10 inline-block">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Start building</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Document is empty. Click a block type from the sidebar on the left to add it here.</p>
                </CardContent>
              </Card>
            ) : (
              proposal.sections.map((block, index) => (
                <Card key={block.id} className="relative group hover:shadow-md transition-shadow">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur shadow-sm border border-gray-100 rounded-md p-1 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500"
                      onClick={() => dispatch({ type: 'REORDER_BLOCKS', payload: { startIndex: index, endIndex: Math.max(0, index - 1) } })}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500"
                      onClick={() => dispatch({ type: 'REORDER_BLOCKS', payload: { startIndex: index, endIndex: Math.min(proposal.sections!.length - 1, index + 1) } })}
                      disabled={index === proposal.sections!.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-4 bg-gray-200 mx-1" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => dispatch({ type: 'REMOVE_BLOCK', payload: block.id })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <CardContent className="p-6">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                      {block.type.replace('_', ' ')}
                    </div>
                    <BlockRenderer block={block} />
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {!isNew && proposal && (
        <ShareProposalModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          proposalId={id as string}
          publicToken={proposal.public_token || ''}
          customerEmail={proposal.customer_email || ''}
          onSent={() => dispatch({ type: 'UPDATE_METADATA', payload: { status: 'sent' } })}
        />
      )}
    </div>
  )
}

export function ProposalEditorPage() {
  return (
    <ProposalEditorProvider>
      <EditorContent />
    </ProposalEditorProvider>
  )
}