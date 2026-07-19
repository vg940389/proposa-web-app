import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicProposalPage } from './PublicProposalPage'
import { usePublicProposal } from '../hooks/usePublicProposal'
import { supabase } from '../lib/supabase'
import { MemoryRouter } from 'react-router-dom'
import { useEffect } from 'react'

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ token: 'mock-public-token' })
  }
})

// Mock usePublicProposal hook
vi.mock('../hooks/usePublicProposal', () => ({
  usePublicProposal: vi.fn()
}))

// Mock useProposalEditor hook
vi.mock('../contexts/ProposalEditorContext', () => ({
  useProposalEditor: () => ({
    dispatch: vi.fn()
  })
}))

// Mock supabase client
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null })
})
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'signatures') {
        return { insert: mockInsert }
      }
      if (table === 'proposals') {
        return { update: mockUpdate }
      }
      return {}
    }),
    functions: {
      invoke: vi.fn()
    }
  }
}))

// Mock react-pdf
vi.mock('react-pdf', () => ({
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: ''
    },
    version: '0.0.0'
  },
  Document: ({ children, onLoadSuccess }: any) => {
    useEffect(() => {
      if (onLoadSuccess) {
        onLoadSuccess({ numPages: 1 })
      }
    }, [onLoadSuccess])
    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber, scale }: any) => (
    <div data-testid={`pdf-page-${pageNumber}`} data-scale={scale}>
      Mock PDF Page {pageNumber}
    </div>
  )
}))

// Mock SignatureModal
vi.mock('../components/pdf/SignatureModal', () => ({
  SignatureModal: ({ isOpen, onClose, onSave, defaultName }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="signature-modal">
        <div>Default Name: {defaultName}</div>
        <button onClick={() => { onSave('typed-signature:Jane Doe:Satisfy'); onClose(); }}>Save Typed Signature</button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    )
  }
}))

// Mock window.alert
const mockAlert = vi.fn()

describe('PublicProposalPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.alert = mockAlert
    // Mock window.scrollTo
    window.scrollTo = vi.fn()
  })

  it('renders loading state initially', () => {
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: null,
      loading: true,
      error: null,
      setProposal: vi.fn()
    })

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Loading secure workspace...')).toBeInTheDocument()
  })

  it('renders proposal not found state when fetch fails', () => {
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: null,
      loading: false,
      error: new Error('Not found'),
      setProposal: vi.fn()
    })

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Proposal not found')).toBeInTheDocument()
  })

  it('renders block-builder proposals and allows signing via name inputs', async () => {
    const mockSetProposal = vi.fn()
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: {
        id: 'prop-123',
        title: 'Block Proposal',
        customer_name: 'Acme Corp',
        customer_email: 'acme@example.com',
        status: 'sent',
        document_type: 'block',
        sections: [
          { id: 'sec-1', type: 'rich_text', order: 0, data: { content: 'Contract terms here' } }
        ]
      },
      loading: false,
      error: null,
      setProposal: mockSetProposal
    } as any)

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Block Proposal')).toBeInTheDocument()
    expect(screen.getByText('Prepared for')).toBeInTheDocument()
    expect(screen.getByText('Sign Proposal')).toBeInTheDocument()

    // Sign the proposal
    const nameInput = screen.getByPlaceholderText('Jane Doe')
    const emailInput = screen.getByPlaceholderText('jane@example.com')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })

    const signBtn = screen.getByRole('button', { name: /Accept and Sign/i })
    fireEvent.click(signBtn)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        proposal_id: 'prop-123',
        signer_role: 'customer',
        signer_name: 'Jane Doe',
        signer_email: 'jane@example.com',
        signature_data: 'typed-signature:Jane Doe'
      })
      expect(mockSetProposal).toHaveBeenCalled()
      expect(mockAlert).toHaveBeenCalledWith('Proposal signed successfully!')
    })
  })

  it('renders PDF proposals with input requirements and field overlay', async () => {
    const mockSetProposal = vi.fn()
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: {
        id: 'prop-pdf',
        title: 'PDF Proposal',
        customer_name: 'Acme Corp',
        customer_email: 'acme@example.com',
        status: 'sent',
        document_type: 'pdf',
        document_url: 'mock-document.pdf',
        pdf_fields: [
          { id: 'field-sig', type: 'signature', pageNumber: 1, x: 10, y: 15, width: 150, height: 48, required: true },
          { id: 'field-date', type: 'date', pageNumber: 1, x: 10, y: 30, width: 150, height: 48, required: true }
        ]
      },
      loading: false,
      error: null,
      setProposal: mockSetProposal
    } as any)

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    // Elements should be visible
    expect(screen.getByText('PDF Proposal')).toBeInTheDocument()
    expect(screen.getByText('Complete Signer Information')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument()

    // Retrieve placed fields by test IDs
    const signField = screen.getByTestId('placed-field-field-sig')
    const dateField = screen.getByTestId('placed-field-field-date')

    // Click signature field without entering Name/Email first should alert
    fireEvent.click(signField)
    expect(mockAlert).toHaveBeenCalledWith('Please fill out your Name and Email in the top panel before signing the document.')

    // Fill details
    const nameInput = screen.getByPlaceholderText('Jane Doe')
    const emailInput = screen.getByPlaceholderText('jane@example.com')
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })

    // Click signature field now opens modal
    fireEvent.click(signField)
    const modal = screen.getByTestId('signature-modal')
    expect(modal).toBeInTheDocument()

    // Save signature
    const saveBtn = screen.getByText('Save Typed Signature')
    fireEvent.click(saveBtn)
    expect(screen.queryByTestId('signature-modal')).not.toBeInTheDocument()

    // Date field clicked
    fireEvent.click(dateField)

    // Submit signatures
    const submitBtn = screen.getByRole('button', { name: /Submit Signatures/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        proposal_id: 'prop-pdf',
        signer_role: 'customer',
        signer_name: 'Jane Doe',
        signer_email: 'jane@example.com',
        signature_data: 'typed-signature:Jane Doe:Satisfy'
      })
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockSetProposal).toHaveBeenCalled()
    })
  })

  it('renders payment stage when proposal status is signed', () => {
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: {
        id: 'prop-signed',
        title: 'Signed Proposal',
        customer_name: 'Acme Corp',
        customer_email: 'acme@example.com',
        status: 'signed',
        document_type: 'block',
        total_amount: 1500,
        currency: 'USD'
      },
      loading: false,
      error: null,
      setProposal: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Proposal Signed Successfully!')).toBeInTheDocument()
    expect(screen.getByText('$1,500')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Proceed to Payment/i })).toBeInTheDocument()
  })

  it('renders completed paid state when proposal status is paid', () => {
    vi.mocked(usePublicProposal).mockReturnValue({
      proposal: {
        id: 'prop-paid',
        title: 'Paid Proposal',
        customer_name: 'Acme Corp',
        customer_email: 'acme@example.com',
        status: 'paid',
        document_type: 'block'
      },
      loading: false,
      error: null,
      setProposal: vi.fn()
    } as any)

    render(
      <MemoryRouter>
        <PublicProposalPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Proposal Completed & Paid!')).toBeInTheDocument()
    expect(screen.getByText('Secured and encrypted transaction')).toBeInTheDocument()
  })
})
