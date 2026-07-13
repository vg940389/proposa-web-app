import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProposalEditor, ProposalEditorProvider } from '../contexts/ProposalEditorContext'
import { useProposal } from '../hooks/useProposal'
import { supabase } from '../lib/supabase'
import { ROUTES } from '../constants/routes'
import { Button } from '../components/ui/Button'
import { generateId } from '../lib/utils'
import { BlockRenderer } from '../components/editor/BlockRenderer'

function EditorContent() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === undefined || id === 'new'
  const { user } = useAuth()
  const navigate = useNavigate()

  const { proposal: initialProposal, loading: loadingInitial } = useProposal(isNew ? undefined : id)
  const { proposal, isSaving, hasUnsavedChanges, dispatch } = useProposalEditor()

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
            created_by: user.uid,
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="text-gray-500 hover:text-gray-700"
          >
            &larr; Back
          </button>
          <input
            type="text"
            value={proposal.title || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { title: e.target.value } })}
            className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-900 placeholder-gray-400"
            placeholder="Proposal Title"
          />
          {hasUnsavedChanges && <span className="text-sm text-amber-500">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary">Preview</Button>
          <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor sidebar / Metadata */}
        <aside className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={proposal.customer_name || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { customer_name: e.target.value } })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
              <input
                type="email"
                value={proposal.customer_email || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_METADATA', payload: { customer_email: e.target.value } })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="client@acme.com"
              />
            </div>
          </div>

          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mt-8 mb-4">Add Blocks</h2>
          <div className="space-y-2">
            {[
              { type: 'cover', label: 'Cover Page' },
              { type: 'rich_text', label: 'Text Block' },
              { type: 'pricing_table', label: 'Pricing Table' },
              { type: 'signature_block', label: 'Signature' }
            ].map((blockType) => (
              <button
                key={blockType.type}
                onClick={() => dispatch({ type: 'ADD_BLOCK', payload: { type: blockType.type as any, data: {} } })}
                className="w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium text-gray-700 bg-white"
              >
                + {blockType.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Document canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          <div className="max-w-4xl mx-auto space-y-6 pb-32">
            {(!proposal.sections || proposal.sections.length === 0) ? (
              <div className="text-center py-20 bg-white border border-gray-200 border-dashed rounded-xl">
                <p className="text-gray-500">Document is empty. Add blocks from the sidebar.</p>
              </div>
            ) : (
              proposal.sections.map((block, index) => (
                <div key={block.id} className="bg-white border border-gray-200 rounded-xl p-6 relative group shadow-sm">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={() => dispatch({ type: 'REORDER_BLOCKS', payload: { startIndex: index, endIndex: Math.max(0, index - 1) } })}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
                    >
                      &uarr;
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REORDER_BLOCKS', payload: { startIndex: index, endIndex: Math.min(proposal.sections!.length - 1, index + 1) } })}
                      disabled={index === proposal.sections!.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
                    >
                      &darr;
                    </button>
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_BLOCK', payload: block.id })}
                      className="p-1 text-red-400 hover:text-red-600 ml-2"
                    >
                      &#10005;
                    </button>
                  </div>

                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                    {block.type.replace('_', ' ')}
                  </div>

                  <BlockRenderer block={block} />
                </div>
              ))
            )}
          </div>
        </div>
      </main>
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