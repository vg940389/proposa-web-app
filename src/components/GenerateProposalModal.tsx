import { useState } from 'react'
import { generateProposal } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { generateId } from '../lib/utils'
import { Button } from './ui/Button'

interface GenerateProposalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GenerateProposalModal({ isOpen, onClose }: GenerateProposalModalProps) {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return
    setIsGenerating(true)
    setError('')

    try {
      const generated = await generateProposal(prompt)
      
      // Save it to Supabase immediately
      const anySupabase = supabase as any
      const { data, error: dbError } = await anySupabase
        .from('proposals')
        .insert({
          title: generated.title || 'AI Generated Proposal',
          customer_name: generated.customer_name || '',
          customer_email: '',
          status: 'draft',
          sections: generated.sections || [],
          public_token: generateId(),
          created_by: user.id,
        })
        .select()
        .single()

      if (dbError) throw dbError
      
      onClose()
      navigate(`/proposals/${data.id}`)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong while generating.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            ✨ Generate with AI
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What kind of proposal do you need?
          </label>
          <textarea
            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 h-32 resize-none bg-gray-50"
            placeholder="E.g. A web development proposal for Acme Corp including a cover page, executive summary, a pricing table for $5000 setup and $1000/mo retainer, and a signature block."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!prompt.trim() || isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
          >
            {isGenerating ? 'Generating...' : 'Generate Proposal'}
          </Button>
        </div>
      </div>
    </div>
  )
}
