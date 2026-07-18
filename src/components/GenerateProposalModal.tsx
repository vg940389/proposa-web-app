import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateProposal } from '../lib/gemini'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { generateId } from '../lib/utils'
import { Button } from '@/components/ui/button'
import { Sparkles, X, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'

interface GenerateProposalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function GenerateProposalModal({ isOpen, onClose }: GenerateProposalModalProps) {
  const [prompt, setPrompt] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle')
  const [error, setError] = useState('')
  const [loadingText, setLoadingText] = useState('Analyzing request...')
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setPrompt('')
      setStatus('idle')
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (status === 'generating') {
      const texts = [
        'Analyzing request...',
        'Structuring sections...',
        'Writing executive summary...',
        'Drafting pricing tables...',
        'Finalizing proposal...'
      ]
      let i = 0
      const interval = setInterval(() => {
        i = (i + 1) % texts.length
        setLoadingText(texts[i])
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [status])

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return
    setStatus('generating')
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

      setStatus('success')

      setTimeout(() => {
        onClose()
        navigate(`/proposals/${data.id}`)
      }, 1200)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Something went wrong while generating.')
      setStatus('idle')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && status === 'idle') onClose()
          }}
        >
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              "bg-white rounded-3xl shadow-2xl overflow-hidden relative",
              status === 'idle' ? "w-full max-w-lg" : "w-full max-w-sm"
            )}
          >
            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col"
                >
                  <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      Generate with AI
                    </h3>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6">
                    <textarea
                      className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-4 h-32 resize-none bg-gray-50/50 transition-colors"
                      placeholder="Describe your proposal... (e.g., A web development proposal for Acme Corp with a cover page, executive summary, and pricing table)"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    />
                    <p className="text-xs text-gray-400 mt-2 flex justify-between items-center">
                      <span>Pro tip: Be specific about sections.</span>
                      <span>Cmd + Enter to generate</span>
                    </p>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <div className="px-6 py-4 bg-gray-50/80 flex justify-end gap-3 rounded-b-3xl">
                    <Button variant="ghost" onClick={onClose} className="rounded-xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm hover:shadow"
                    >
                      Generate Proposal
                    </Button>
                  </div>
                </motion.div>
              )}

              {status === 'generating' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-10 flex flex-col items-center justify-center text-center min-h-[240px] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 via-white to-purple-50 opacity-50" />

                  {/* Apple-like glowing animation */}
                  <div className="relative mb-8">
                    <motion.div
                      className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-20"
                      animate={{ scale: [1.5, 1, 1.5], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    />
                    <div className="relative bg-white rounded-full p-4 shadow-sm border border-gray-100 z-10">
                      <Sparkles className="w-8 h-8 text-indigo-500" />
                    </div>
                  </div>

                  <h3 className="text-xl font-medium text-gray-900 mb-2 relative z-10">
                    Crafting your proposal
                  </h3>

                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingText}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-gray-500 relative z-10 h-5"
                    >
                      {loadingText}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>
              )}

              {status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-10 flex flex-col items-center justify-center text-center min-h-[240px]"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15, stiffness: 200 }}
                    className="mb-4"
                  >
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Ready to go!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Opening your new proposal...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
