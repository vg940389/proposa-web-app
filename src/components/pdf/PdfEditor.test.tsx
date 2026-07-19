import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEffect } from 'react'
import { PdfEditor } from './PdfEditor'
import { useProposalEditor } from '@/contexts/ProposalEditorContext'

// Capture drag end callback
let capturedDragEndHandler: any = null

// Mock dnd-kit core
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: any) => {
    capturedDragEndHandler = onDragEnd
    return <div data-testid="dnd-context">{children}</div>
  },
  useDraggable: ({ id }: any) => ({
    attributes: { 'data-draggable-id': id },
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false
  }),
  useDroppable: () => ({
    setNodeRef: () => {}
  }),
  MouseSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn()
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
        onLoadSuccess({ numPages: 2 })
      }
    }, [onLoadSuccess])
    return <div data-testid="pdf-document">{children}</div>
  },
  Page: ({ pageNumber, scale }: any) => {
    return (
      <div data-testid={`pdf-page-${pageNumber}`} data-scale={scale}>
        Page {pageNumber}
      </div>
    )
  }
}))

// Mock generateId to get deterministic IDs
vi.mock('@/lib/utils', () => ({
  generateId: () => 'mocked-field-id',
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' ')
}))

// Mock useProposalEditor hook
vi.mock('@/contexts/ProposalEditorContext', () => ({
  useProposalEditor: vi.fn()
}))

describe('PdfEditor', () => {
  const mockDispatch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useProposalEditor).mockReturnValue({
      proposal: {
        pdf_fields: [
          {
            id: 'field-1',
            type: 'signature',
            pageNumber: 1,
            x: 10,
            y: 20,
            width: 150,
            height: 48,
            required: true
          }
        ]
      },
      isSaving: false,
      hasUnsavedChanges: false,
      dispatch: mockDispatch
    })
  })

  it('renders the editor layout with sidebar fields and PDF document controls', () => {
    render(<PdfEditor documentUrl="mock.pdf" />)

    expect(screen.getByText('Fields')).toBeInTheDocument()
    expect(screen.getByText('Signature')).toBeInTheDocument()
    expect(screen.getByText('Date Signed')).toBeInTheDocument()
    expect(screen.getByText('Text Field')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-document')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-page-1')).toBeInTheDocument()
    expect(screen.getByTestId('pdf-page-2')).toBeInTheDocument()
  })

  it('handles scale zooming correctly', () => {
    render(<PdfEditor documentUrl="mock.pdf" />)

    // Initial scale is 100%
    expect(screen.getByText('100%')).toBeInTheDocument()

    // Zoom Out
    const zoomOutBtn = screen.getByTestId('zoom-out')
    fireEvent.click(zoomOutBtn)
    expect(screen.getByText('90%')).toBeInTheDocument()

    // Zoom In
    const zoomInBtn = screen.getByTestId('zoom-in')
    fireEvent.click(zoomInBtn)
    expect(screen.getByText('100%')).toBeInTheDocument()
    fireEvent.click(zoomInBtn)
    expect(screen.getByText('110%')).toBeInTheDocument()
  })

  it('renders placed fields and displays field settings when clicked', () => {
    render(<PdfEditor documentUrl="mock.pdf" />)

    const placedField = screen.getByTestId('placed-field-field-1')
    expect(placedField).toBeInTheDocument()

    // Clicking the placed field should display Field Settings
    fireEvent.click(placedField)
    expect(screen.getByText('Field Settings')).toBeInTheDocument()
    expect(screen.getByText('Required')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-required')).toBeInTheDocument()
  })

  it('toggles required status of selected field and dispatches update', () => {
    render(<PdfEditor documentUrl="mock.pdf" />)

    const placedField = screen.getByTestId('placed-field-field-1')
    fireEvent.click(placedField)

    const toggleBtn = screen.getByTestId('toggle-required')
    fireEvent.click(toggleBtn)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_METADATA',
      payload: {
        pdf_fields: [
          {
            id: 'field-1',
            type: 'signature',
            pageNumber: 1,
            x: 10,
            y: 20,
            width: 150,
            height: 48,
            required: false // toggled from true to false
          }
        ]
      }
    })
  })

  it('deletes selected field and dispatches update', () => {
    render(<PdfEditor documentUrl="mock.pdf" />)

    const placedField = screen.getByTestId('placed-field-field-1')
    fireEvent.click(placedField)

    const deleteBtn = screen.getByRole('button', { name: /Delete Field/i })
    fireEvent.click(deleteBtn)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_METADATA',
      payload: {
        pdf_fields: [] // field removed
      }
    })
  })

  it('handles drag-and-drop end for a new field', () => {
    const { container } = render(<PdfEditor documentUrl="mock.pdf" />)

    // Render page with mock ID/dimensions
    const pageContainer = container.querySelector('#page-1')
    expect(pageContainer).toBeInTheDocument()

    if (pageContainer) {
      vi.spyOn(pageContainer, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        top: 100,
        width: 600,
        height: 800,
        right: 700,
        bottom: 900,
        x: 100,
        y: 100,
        toJSON: () => {}
      })
    }

    // Call captured drag end for "new-signature" field dropped onto page-1
    const mockDragEndEvent = {
      active: { id: 'new-signature' },
      over: { id: 'page-1' },
      rects: {
        translated: {
          left: 200,
          top: 300,
          width: 150,
          height: 48,
          right: 350,
          bottom: 348,
          x: 200,
          y: 300,
          toJSON: () => {}
        }
      }
    }

    capturedDragEndHandler(mockDragEndEvent)

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_METADATA',
      payload: {
        pdf_fields: [
          {
            id: 'field-1',
            type: 'signature',
            pageNumber: 1,
            x: 10,
            y: 20,
            width: 150,
            height: 48,
            required: true
          },
          {
            id: 'mocked-field-id',
            type: 'signature',
            pageNumber: 1,
            // (200 - 100) / 600 * 100 = 16.6666...
            x: expect.any(Number),
            // (300 - 100) / 800 * 100 = 25.0
            y: expect.any(Number),
            width: 150,
            height: 48,
            required: true
          }
        ]
      }
    })
  })
})
