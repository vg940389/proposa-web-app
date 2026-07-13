export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          company_name: string | null
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          company_name?: string | null
          email: string
          avatar_url?: string | null
        }
        Update: {
          full_name?: string | null
          company_name?: string | null
          email?: string
          avatar_url?: string | null
        }
      }
      proposals: {
        Row: {
          id: string
          created_by: string
          title: string
          status: string
          sections: unknown
          customer_name: string | null
          customer_email: string | null
          public_token: string
          valid_until: string | null
          total_amount: number | null
          currency: string
          requires_payment: boolean
          sent_at: string | null
          viewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title?: string
          status?: string
          sections?: unknown
          customer_name?: string | null
          customer_email?: string | null
          valid_until?: string | null
          total_amount?: number | null
          currency?: string
          requires_payment?: boolean
        }
        Update: {
          title?: string
          status?: string
          sections?: unknown
          customer_name?: string | null
          customer_email?: string | null
          valid_until?: string | null
          total_amount?: number | null
          currency?: string
          requires_payment?: boolean
          sent_at?: string | null
          viewed_at?: string | null
        }
      }
      signatures: {
        Row: {
          id: string
          proposal_id: string
          signer_role: string
          signer_name: string
          signer_email: string
          signature_data: string
          ip_address: string | null
          user_agent: string | null
          signed_at: string
        }
        Insert: {
          proposal_id: string
          signer_role: string
          signer_name: string
          signer_email: string
          signature_data: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: Record<string, never>
      }
      payments: {
        Row: {
          id: string
          proposal_id: string
          stripe_session_id: string
          stripe_payment_intent_id: string | null
          amount: number
          currency: string
          status: string
          customer_email: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          proposal_id: string
          stripe_session_id: string
          amount: number
          currency?: string
          customer_email?: string | null
        }
        Update: {
          stripe_payment_intent_id?: string | null
          status?: string
          completed_at?: string | null
        }
      }
    }
  }
}
