import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ProposalRow } from '../types/proposal'
import { useAuth } from '../contexts/AuthContext'

export function useProposals() {
  const [proposals, setProposals] = useState<ProposalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setProposals([])
      setLoading(false)
      return
    }

    const fetchProposals = async () => {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        // The cast here is because supabase 'sections' is JSON, while our ProposalRow expects SectionBlock[]
        setProposals(data as unknown as ProposalRow[])
      } catch (e: any) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }

    fetchProposals()
  }, [user])

  return { proposals, loading, error, setProposals }
}
