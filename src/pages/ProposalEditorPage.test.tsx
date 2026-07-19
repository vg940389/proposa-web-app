import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProposalEditorPage } from './ProposalEditorPage'
import { useAuth } from '../contexts/AuthContext'
import { useProposal } from '../hooks/useProposal'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// Mock react-router-dom useParams and useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'new' })
  }
})

// Mock Auth Context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock useProposal hook
vi.mock('../hooks/useProposal', () => ({
  useProposal: vi.fn()
}))

// Mock supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-proposal-id' }, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}))

// Mock sub-components
vi.mock('../components/pdf/PdfUploader', () => ({
  PdfUploader: ({ onUploadSuccess }: any) => (
    <div data-testid="pdf-uploader">
      <button onClick={() => onUploadSuccess('mocked-pdf-url')}>Mock Upload Success</button>
    </div>
  )
}))

vi.mock('../components/pdf/PdfEditor', () => ({
  PdfEditor: ({ documentUrl }: any) => (
    <div data-testid="pdf-editor" data-url={documentUrl}>
      PdfEditor Component
    </div>
  )
}))

describe('ProposalEditorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-123' },
      loading: false,
      signOut: vi.fn()
    })
    vi.mocked(useProposal).mockReturnValue({
      proposal: null,
      loading: false,
      error: null,
      setProposal: vi.fn()
    })
  })

  it('renders the initial selection page for new proposals with both workspace choices', () => {
    render(
      <MemoryRouter>
        <ProposalEditorPage />
      </MemoryRouter>
    )

    expect(screen.getByText('Choose your proposal builder')).toBeInTheDocument()
    expect(screen.getByText('Interactive Block Builder')).toBeInTheDocument()
    expect(screen.getByText('PDF Document Signer')).toBeInTheDocument()
  })

  it('switches to block builder workspace when chosen', () => {
    render(
      <MemoryRouter>
        <ProposalEditorPage />
      </MemoryRouter>
    )

    const blockCard = screen.getByText('Interactive Block Builder')
    fireEvent.click(blockCard)

    // Verify it transitions to block editor view (renders block builder details sidebar)
    expect(screen.getByText('Client Name')).toBeInTheDocument()
    expect(screen.getByText('Client Email')).toBeInTheDocument()
    expect(screen.getByText('Add Blocks')).toBeInTheDocument()
  })

  it('switches to PDF uploader workspace when PDF option is chosen', () => {
    render(
      <MemoryRouter>
        <ProposalEditorPage />
      </MemoryRouter>
    )

    const pdfCard = screen.getByText('PDF Document Signer')
    fireEvent.click(pdfCard)

    // Verify it renders the uploader view
    expect(screen.getByTestId('pdf-uploader')).toBeInTheDocument()
    expect(screen.queryByTestId('pdf-editor')).not.toBeInTheDocument()
  })

  it('transitions to PDF editor when PDF uploader finishes successfully', async () => {
    render(
      <MemoryRouter>
        <ProposalEditorPage />
      </MemoryRouter>
    )

    // Go to PDF workspace
    fireEvent.click(screen.getByText('PDF Document Signer'))

    // Trigger upload success
    const uploadBtn = screen.getByText('Mock Upload Success')
    fireEvent.click(uploadBtn)

    // Verify PDF editor displays with the uploaded document URL
    await waitFor(() => {
      const pdfEditor = screen.getByTestId('pdf-editor')
      expect(pdfEditor).toBeInTheDocument()
      expect(pdfEditor.getAttribute('data-url')).toBe('mocked-pdf-url')
    })
  })
})
