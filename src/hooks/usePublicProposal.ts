import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProposalRow } from '../types/proposal'

export function usePublicProposal(token?: string) {
  const [proposal, setProposal] = useState<ProposalRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!token) {
      setProposal(null)
      setLoading(false)
      return
    }

    const fetchProposal = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .eq('public_token', token)
          .single()

        if (error) throw error
        setProposal(data as unknown as ProposalRow)
      } catch (e: any) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchProposal()
  }, [token])

  return { proposal, loading, error, setProposal }
}
