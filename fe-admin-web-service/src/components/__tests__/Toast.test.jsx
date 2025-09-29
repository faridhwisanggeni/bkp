import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { ToastProvider, useToast, formatErrorMessage } from '../Toast'

// Mock component to test the useToast hook
const TestComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  
  return (
    <div>
      <button onClick={() => showSuccess('Success message')}>Show Success</button>
      <button onClick={() => showError('Error message')}>Show Error</button>
      <button onClick={() => showWarning('Warning message')}>Show Warning</button>
      <button onClick={() => showInfo('Info message')}>Show Info</button>
    </div>
  )
}

describe('Toast Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('ToastProvider', () => {
    it('should render children without crashing', () => {
      render(
        <ToastProvider>
          <div>Test content</div>
        </ToastProvider>
      )
      
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should provide toast context to children', () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )
      
      expect(screen.getByText('Show Success')).toBeInTheDocument()
      expect(screen.getByText('Show Error')).toBeInTheDocument()
      expect(screen.getByText('Show Warning')).toBeInTheDocument()
      expect(screen.getByText('Show Info')).toBeInTheDocument()
    })
  })

  describe('useToast hook', () => {
    it('should throw error when used outside ToastProvider', () => {
      const TestComponentWithoutProvider = () => {
        useToast()
        return <div>Test</div>
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useToast must be used within a ToastProvider')
      
      consoleSpy.mockRestore()
    })

    it('should provide toast functions when used within ToastProvider', () => {
      let toastFunctions
      
      const TestComponent = () => {
        toastFunctions = useToast()
        return <div>Test</div>
      }

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      expect(toastFunctions).toHaveProperty('showSuccess')
      expect(toastFunctions).toHaveProperty('showError')
      expect(toastFunctions).toHaveProperty('showWarning')
      expect(toastFunctions).toHaveProperty('showInfo')
      expect(toastFunctions).toHaveProperty('removeToast')
    })
  })

  describe('Toast Display', () => {
    it('should display success toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument()
      })
    })

    it('should display error toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Error'))
      
      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })
    })

    it('should display warning toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Warning'))
      
      await waitFor(() => {
        expect(screen.getByText('Warning message')).toBeInTheDocument()
      })
    })

    it('should display info toast', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Info'))
      
      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument()
      })
    })

    it('should display multiple toasts', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))
      fireEvent.click(screen.getByText('Show Error'))
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument()
        expect(screen.getByText('Error message')).toBeInTheDocument()
      })
    })
  })

  describe('Toast Removal', () => {
    it('should remove toast when close button is clicked', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    })

    it('should auto-remove toast after duration', async () => {
      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Success'))
      
      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument()
      })

      // Fast-forward time by 5 seconds (default duration)
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      await waitFor(() => {
        expect(screen.queryByText('Success message')).not.toBeInTheDocument()
      })
    })

    it('should not auto-remove toast when duration is 0', async () => {
      const TestComponentWithPersistentToast = () => {
        const { showSuccess } = useToast()
        
        return (
          <button onClick={() => showSuccess('Persistent message', 0)}>
            Show Persistent
          </button>
        )
      }

      render(
        <ToastProvider>
          <TestComponentWithPersistentToast />
        </ToastProvider>
      )

      fireEvent.click(screen.getByText('Show Persistent'))
      
      await waitFor(() => {
        expect(screen.getByText('Persistent message')).toBeInTheDocument()
      })

      // Fast-forward time by 10 seconds
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      // Toast should still be there
      expect(screen.getByText('Persistent message')).toBeInTheDocument()
    })
  })

  describe('formatErrorMessage utility', () => {
    it('should return string error as is', () => {
      const result = formatErrorMessage('Simple error message')
      expect(result).toBe('Simple error message')
    })

    it('should extract message from response.data.message', () => {
      const error = {
        response: {
          data: {
            message: 'API error message'
          }
        }
      }
      const result = formatErrorMessage(error)
      expect(result).toBe('API error message')
    })

    it('should extract error from response.data.error', () => {
      const error = {
        response: {
          data: {
            error: 'API error'
          }
        }
      }
      const result = formatErrorMessage(error)
      expect(result).toBe('API error')
    })

    it('should handle array details', () => {
      const error = {
        response: {
          data: {
            details: ['Error 1', 'Error 2', 'Error 3']
          }
        }
      }
      const result = formatErrorMessage(error)
      expect(result).toBe('Error 1, Error 2, Error 3')
    })

    it('should handle string details', () => {
      const error = {
        response: {
          data: {
            details: 'Detailed error message'
          }
        }
      }
      const result = formatErrorMessage(error)
      expect(result).toBe('Detailed error message')
    })

    it('should format network error', () => {
      const error = { message: 'Network Error: Connection failed' }
      const result = formatErrorMessage(error)
      expect(result).toBe('Unable to connect to server. Please check your internet connection.')
    })

    it('should format timeout error', () => {
      const error = { message: 'Request timeout occurred' }
      const result = formatErrorMessage(error)
      expect(result).toBe('Request timed out. Please try again.')
    })

    it('should format 401 error', () => {
      const error = { message: 'Error 401: Unauthorized' }
      const result = formatErrorMessage(error)
      expect(result).toBe('Your session has expired. Please log in again.')
    })

    it('should format 403 error', () => {
      const error = { message: 'Error 403: Forbidden' }
      const result = formatErrorMessage(error)
      expect(result).toBe('You do not have permission to perform this action.')
    })

    it('should format 404 error', () => {
      const error = { message: 'Error 404: Not Found' }
      const result = formatErrorMessage(error)
      expect(result).toBe('The requested resource was not found.')
    })

    it('should format 500 error', () => {
      const error = { message: 'Error 500: Internal Server Error' }
      const result = formatErrorMessage(error)
      expect(result).toBe('Server error occurred. Please try again later.')
    })

    it('should return generic message for unknown error', () => {
      const error = {}
      const result = formatErrorMessage(error)
      expect(result).toBe('An unexpected error occurred. Please try again.')
    })

    it('should return original message for unrecognized error message', () => {
      const error = { message: 'Some custom error message' }
      const result = formatErrorMessage(error)
      expect(result).toBe('Some custom error message')
    })
  })
})
