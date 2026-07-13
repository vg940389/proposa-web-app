import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProposalRow } from '../types/proposal'

export function useProposal(id?: string) {
  const [proposal, setProposal] = useState<ProposalRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
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
          .eq('id', id)
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
  }, [id])

  return { proposal, loading, error, setProposal }
}
