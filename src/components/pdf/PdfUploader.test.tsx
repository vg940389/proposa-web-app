import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PdfUploader } from './PdfUploader'
import { useAuth } from '@/contexts/AuthContext'
import { uploadProposalPdf } from '@/lib/storage'

// Mock the Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn()
}))

// Mock the storage utility
vi.mock('@/lib/storage', () => ({
  uploadProposalPdf: vi.fn()
}))

describe('PdfUploader', () => {
  const mockOnUploadSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock URL.createObjectURL for when user is not logged in (mock upload path)
    if (typeof window !== 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-pdf-url')
    }
  })

  it('renders the upload zone with instructions', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } as any, loading: false, signOut: vi.fn() } as any)

    render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    expect(screen.getByText('Upload your PDF')).toBeInTheDocument()
    expect(screen.getByText(/Drag and drop your PDF here, or click to browse/)).toBeInTheDocument()
  })

  it('displays an error if a non-PDF file is selected', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } as any, loading: false, signOut: vi.fn() } as any)

    const { container } = render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    const input = container.querySelector('#pdf-file-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Please upload a PDF file')).toBeInTheDocument()
    })
    expect(mockOnUploadSuccess).not.toHaveBeenCalled()
  })

  it('displays an error if the PDF file exceeds 10MB limit', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } as any, loading: false, signOut: vi.fn() } as any)

    const { container } = render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    // Create a mock large file
    const file = new File([''], 'large.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }) // 11MB

    const input = container.querySelector('#pdf-file-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument()
    })
    expect(mockOnUploadSuccess).not.toHaveBeenCalled()
  })

  it('calls uploadProposalPdf and onUploadSuccess when logged in and a valid PDF is uploaded', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } as any, loading: false, signOut: vi.fn() } as any)
    vi.mocked(uploadProposalPdf).mockResolvedValue('https://supabase-bucket-url.com/proposal.pdf')

    const { container } = render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    const file = new File(['pdf-content'], 'test.pdf', { type: 'application/pdf' })
    const input = container.querySelector('#pdf-file-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadProposalPdf).toHaveBeenCalledWith(file, 'user-123')
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('https://supabase-bucket-url.com/proposal.pdf')
    })
  })

  it('performs mock upload when user is not logged in', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, signOut: vi.fn() } as any)

    const { container } = render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    const file = new File(['pdf-content'], 'test.pdf', { type: 'application/pdf' })
    const input = container.querySelector('#pdf-file-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockOnUploadSuccess).toHaveBeenCalledWith('blob:mock-pdf-url')
    }, { timeout: 2000 })
  })

  it('handles upload errors gracefully', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { id: 'user-123' } as any, loading: false, signOut: vi.fn() } as any)
    vi.mocked(uploadProposalPdf).mockRejectedValue(new Error('Network failure'))

    const { container } = render(<PdfUploader onUploadSuccess={mockOnUploadSuccess} />)

    const file = new File(['pdf-content'], 'test.pdf', { type: 'application/pdf' })
    const input = container.querySelector('#pdf-file-input') as HTMLInputElement

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('Network failure')).toBeInTheDocument()
    })
    expect(mockOnUploadSuccess).not.toHaveBeenCalled()
  })
})
