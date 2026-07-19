import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignatureModal } from './SignatureModal'

// Mock CSS/font loading to prevent errors/network calls
beforeEach(() => {
  vi.clearAllMocks()
  // Mock window.alert
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

describe('SignatureModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  it('renders modal with title and active Draw tab by default', () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        defaultName="John Doe"
      />
    )

    expect(screen.getByText('Create Your Signature')).toBeInTheDocument()
    expect(screen.getByText('Draw Signature')).toBeInTheDocument()
    expect(screen.getByText('Type Signature')).toBeInTheDocument()
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('switches to Type Signature tab and allows typing a name', async () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        defaultName="John Doe"
      />
    )

    const typeTabButton = screen.getByText('Type Signature')
    fireEvent.click(typeTabButton)

    // Verify input and cursive font picker are visible
    const input = screen.getByPlaceholderText('Type your full name') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.value).toBe('John Doe')

    // Change typed name
    fireEvent.change(input, { target: { value: 'Jane Smith' } })
    expect(input.value).toBe('Jane Smith')

    // Expect font choices to be rendered
    expect(screen.getByText('Satisfy')).toBeInTheDocument()
    expect(screen.getByText('Great Vibes')).toBeInTheDocument()
    expect(screen.getByText('Alex Brush')).toBeInTheDocument()
    expect(screen.getByText('Brush Script')).toBeInTheDocument()
  })

  it('submits a typed signature correctly with the selected font name', () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        defaultName="Alice"
      />
    )

    // Switch to type signature tab
    const typeTabButton = screen.getByText('Type Signature')
    fireEvent.click(typeTabButton)

    // Select "Alex Brush" font
    const alexBrushButton = screen.getByText('Alex Brush')
    fireEvent.click(alexBrushButton)

    // Save
    const applyButton = screen.getByText('Apply Signature')
    fireEvent.click(applyButton)

    expect(mockOnSave).toHaveBeenCalledWith('typed-signature:Alice:Alex Brush')
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('alerts if applying an empty typed signature', () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        defaultName=""
      />
    )

    // Switch to type signature tab
    const typeTabButton = screen.getByText('Type Signature')
    fireEvent.click(typeTabButton)

    // Clear input
    const input = screen.getByPlaceholderText('Type your full name') as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })

    // Save
    const applyButton = screen.getByText('Apply Signature')
    fireEvent.click(applyButton)

    expect(window.alert).toHaveBeenCalledWith('Please type your name first.')
    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('calls onClose when close button or Cancel is clicked', () => {
    render(
      <SignatureModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        defaultName="John Doe"
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
