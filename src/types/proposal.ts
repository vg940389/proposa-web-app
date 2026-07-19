export type SectionType =
  | 'cover'
  | 'rich_text'
  | 'pricing_table'
  | 'terms'
  | 'signature_block'
  | 'image'
  | 'spacer'

export interface SectionBlock {
  id: string
  type: SectionType
  order: number
  data: Record<string, unknown>
}

export interface CoverData {
  title: string
  subtitle: string
  date: string
  logo_url: string | null
}

export interface RichTextData {
  heading: string
  body: string
}

export interface PricingItem {
  description: string
  qty: number
  unit_price: number
}

export interface PricingTableData {
  items: PricingItem[]
  tax_rate: number
  discount: number
}

export interface TermsData {
  body: string
}

export interface SignatureBlockData {
  label: string
  required: boolean
}

export interface ImageData {
  url: string
  alt: string
  caption: string
}

export interface SpacerData {
  height: number
}

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'declined'

export type PdfFieldType = 'signature' | 'date' | 'text'

export interface PdfField {
  id: string
  type: PdfFieldType
  pageNumber: number
  x: number // percentage 0-100
  y: number // percentage 0-100
  width: number
  height: number
  required: boolean
  value?: string // to store the value filled in by the recipient/signer
}

export interface ProposalRow {
  id: string
  created_by: string
  title: string
  status: ProposalStatus
  sections: SectionBlock[]
  document_type: 'block' | 'pdf'
  document_url: string | null
  pdf_fields: PdfField[]
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

export interface SignatureRow {
  id: string
  proposal_id: string
  signer_role: 'sender' | 'customer'
  signer_name: string
  signer_email: string
  signature_data: string
  ip_address: string | null
  user_agent: string | null
  signed_at: string
}

export interface PaymentRow {
  id: string
  proposal_id: string
  razorpay_order_id: string
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  customer_email: string | null
  created_at: string
  completed_at: string | null
}
