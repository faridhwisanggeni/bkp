import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../Modal'

describe('Modal Component', () => {
  const defaultProps = {
    open: true,
    title: 'Test Modal',
    message: 'This is a test message',
    onConfirm: vi.fn(),
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<Modal {...defaultProps} open={false} />)
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })

    it('should render when open is true', () => {
      render(<Modal {...defaultProps} />)
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('This is a test message')).toBeInTheDocument()
    })

    it('should render with default title when not provided', () => {
      render(<Modal {...defaultProps} title={undefined} />)
      
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    it('should render without message when not provided', () => {
      render(<Modal {...defaultProps} message={undefined} />)
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.queryByText('This is a test message')).not.toBeInTheDocument()
    })

    it('should render with default button texts', () => {
      render(<Modal {...defaultProps} />)
      
      expect(screen.getByText('Confirm')).toBeInTheDocument()
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should render with custom button texts', () => {
      render(
        <Modal 
          {...defaultProps} 
          confirmText="Save" 
          cancelText="Discard" 
        />
      )
      
      expect(screen.getByText('Save')).toBeInTheDocument()
      expect(screen.getByText('Discard')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      render(<Modal {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Confirm'))
      
      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when cancel button is clicked', () => {
      render(<Modal {...defaultProps} />)
      
      fireEvent.click(screen.getByText('Cancel'))
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when backdrop is clicked', () => {
      render(<Modal {...defaultProps} />)
      
      // Click on the backdrop (the overlay div)
      const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/40')
      fireEvent.click(backdrop)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should not call onClose when modal content is clicked', () => {
      render(<Modal {...defaultProps} />)
      
      // Click on the modal content
      fireEvent.click(screen.getByText('Test Modal'))
      
      expect(defaultProps.onClose).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(<Modal {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('should have proper modal structure', () => {
      render(<Modal {...defaultProps} />)
      
      // Check for modal container
      const modalContainer = document.querySelector('.fixed.inset-0.z-50')
      expect(modalContainer).toBeInTheDocument()
      
      // Check for modal content
      const modalContent = document.querySelector('.relative.bg-white')
      expect(modalContent).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should have correct CSS classes for modal container', () => {
      render(<Modal {...defaultProps} />)
      
      const container = document.querySelector('.fixed.inset-0.z-50.flex.items-center.justify-center')
      expect(container).toBeInTheDocument()
    })

    it('should have correct CSS classes for backdrop', () => {
      render(<Modal {...defaultProps} />)
      
      const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/40')
      expect(backdrop).toBeInTheDocument()
    })

    it('should have correct CSS classes for modal content', () => {
      render(<Modal {...defaultProps} />)
      
      const content = document.querySelector('.relative.bg-white.w-full.max-w-md.rounded-lg.shadow-lg.border.p-5')
      expect(content).toBeInTheDocument()
    })

    it('should have correct CSS classes for buttons', () => {
      render(<Modal {...defaultProps} />)
      
      const cancelButton = screen.getByText('Cancel')
      const confirmButton = screen.getByText('Confirm')
      
      expect(cancelButton).toHaveClass('px-4', 'py-2', 'border', 'rounded-md')
      expect(confirmButton).toHaveClass('px-4', 'py-2', 'bg-blue-600', 'text-white', 'rounded-md', 'hover:bg-blue-700')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing onConfirm prop', () => {
      const { onConfirm, ...propsWithoutOnConfirm } = defaultProps
      
      render(<Modal {...propsWithoutOnConfirm} />)
      
      // Should not throw error when clicking confirm
      expect(() => {
        fireEvent.click(screen.getByText('Confirm'))
      }).not.toThrow()
    })

    it('should handle missing onClose prop', () => {
      const { onClose, ...propsWithoutOnClose } = defaultProps
      
      render(<Modal {...propsWithoutOnClose} />)
      
      // Should not throw error when clicking cancel or backdrop
      expect(() => {
        fireEvent.click(screen.getByText('Cancel'))
      }).not.toThrow()
      
      expect(() => {
        const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/40')
        fireEvent.click(backdrop)
      }).not.toThrow()
    })

    it('should handle empty strings for texts', () => {
      render(
        <Modal 
          {...defaultProps} 
          title=""
          message=""
          confirmText=""
          cancelText=""
        />
      )
      
      // Should still render buttons even with empty text
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('should handle long text content', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines'
      const longMessage = 'This is a very long message that should be displayed properly even when it contains a lot of text and might wrap to multiple lines in the modal'
      
      render(
        <Modal 
          {...defaultProps} 
          title={longTitle}
          message={longMessage}
        />
      )
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })
  })
})
