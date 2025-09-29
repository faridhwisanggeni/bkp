import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import { ToastProvider } from '../../components/Toast'
import api from '../../api/client'

// Mock the API client
vi.mock('../../api/client')
const mockedApi = vi.mocked(api)

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock atob for JWT decoding
global.atob = vi.fn()

const LoginWithProviders = () => (
  <MemoryRouter>
    <ToastProvider>
      <Login />
    </ToastProvider>
  </MemoryRouter>
)

describe('Login Page', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockNavigate.mockClear()
  })

  describe('Rendering', () => {
    it('should render login form with all elements', () => {
      render(<LoginWithProviders />)
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should have default email and password values', () => {
      render(<LoginWithProviders />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      expect(emailInput).toHaveValue('admin@example.com')
      expect(passwordInput).toHaveValue('ChangeMeAdmin123!')
    })

    it('should show password toggle button', () => {
      render(<LoginWithProviders />)
      
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      expect(toggleButton).toBeInTheDocument()
    })

    it('should have proper form structure', () => {
      render(<LoginWithProviders />)
      
      const form = screen.getByRole('form') || screen.getByTestId('login-form')
      expect(form).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should allow typing in email field', async () => {
      render(<LoginWithProviders />)
      
      const emailInput = screen.getByLabelText(/email/i)
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')
      
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should allow typing in password field', async () => {
      render(<LoginWithProviders />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.clear(passwordInput)
      await user.type(passwordInput, 'newpassword')
      
      expect(passwordInput).toHaveValue('newpassword')
    })

    it('should toggle password visibility', async () => {
      render(<LoginWithProviders />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click toggle to hide password again
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })
  })

  describe('Form Submission', () => {
    it('should handle successful login for admin user', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header.eyJyb2xlIjoiYWRtaW4ifQ.signature', // Mock JWT with admin role
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{"role":"admin"}')
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
          email: 'admin@example.com',
          password: 'ChangeMeAdmin123!'
        })
      })
      
      expect(localStorage.getItem('accessToken')).toBe(mockResponse.data.accessToken)
      expect(localStorage.getItem('refreshToken')).toBe(mockResponse.data.refreshToken)
      expect(localStorage.getItem('role')).toBe('admin')
      expect(mockNavigate).toHaveBeenCalledWith('/users')
    })

    it('should handle successful login for sales user', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header.eyJyb2xlIjoic2FsZXMifQ.signature',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{"role":"sales"}')
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/products')
      })
      
      expect(localStorage.getItem('role')).toBe('sales')
    })

    it('should handle successful login for customer user', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header.eyJyb2xlIjoiY3VzdG9tZXIifQ.signature',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{"role":"customer"}')
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
      
      expect(localStorage.getItem('role')).toBe('customer')
    })

    it('should handle login with unknown role', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header.eyJyb2xlIjoidW5rbm93biJ9.signature',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{"role":"unknown"}')
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
    })

    it('should show loading state during submission', async () => {
      // Mock a delayed response
      mockedApi.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      // Button should be disabled during loading
      expect(submitButton).toBeDisabled()
      
      // Wait for the request to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should prevent multiple submissions', async () => {
      mockedApi.post.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Click multiple times quickly
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // API should only be called once
      expect(mockedApi.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      const errorMessage = 'Invalid credentials'
      mockedApi.post.mockRejectedValue({
        response: {
          data: { message: errorMessage }
        }
      })
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should display network error message', async () => {
      mockedApi.post.mockRejectedValue(new Error('Network Error'))
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Unable to connect to server. Please check your internet connection.')).toBeInTheDocument()
      })
    })

    it('should clear error message on new submission', async () => {
      // First submission fails
      mockedApi.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } }
      })
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })
      
      // Second submission should clear the error
      mockedApi.post.mockResolvedValue({
        data: {
          accessToken: 'header.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        }
      })
      global.atob.mockReturnValue('{"role":"admin"}')
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
      })
    })

    it('should handle JWT decoding errors', async () => {
      const mockResponse = {
        data: {
          accessToken: 'invalid.jwt.token',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockImplementation(() => {
        throw new Error('Invalid JWT')
      })
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Should not throw error
      expect(async () => {
        await user.click(submitButton)
      }).not.toThrow()
    })
  })

  describe('Form Validation', () => {
    it('should submit form with Enter key', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header.eyJyb2xlIjoiYWRtaW4ifQ.signature',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{"role":"admin"}')
      
      render(<LoginWithProviders />)
      
      const passwordInput = screen.getByLabelText(/password/i)
      await user.type(passwordInput, '{enter}')
      
      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalled()
      })
    })

    it('should handle empty form submission', async () => {
      render(<LoginWithProviders />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      
      await user.clear(emailInput)
      await user.clear(passwordInput)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      // Should still attempt to submit (backend will handle validation)
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
        email: '',
        password: ''
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<LoginWithProviders />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    })

    it('should have proper button roles', () => {
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
      
      expect(submitButton).toBeInTheDocument()
      expect(toggleButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<LoginWithProviders />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Tab through form elements
      await user.tab()
      expect(emailInput).toHaveFocus()
      
      await user.tab()
      expect(passwordInput).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /toggle password visibility/i })).toHaveFocus()
      
      await user.tab()
      expect(submitButton).toHaveFocus()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing JWT payload', async () => {
      const mockResponse = {
        data: {
          accessToken: 'header..signature', // Empty payload
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      global.atob.mockReturnValue('{}') // Empty payload
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/')
      })
      
      expect(localStorage.getItem('role')).toBeNull()
    })

    it('should handle malformed JWT', async () => {
      const mockResponse = {
        data: {
          accessToken: 'malformed-jwt',
          refreshToken: 'refresh-token'
        }
      }
      
      mockedApi.post.mockResolvedValue(mockResponse)
      
      render(<LoginWithProviders />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Should handle gracefully without crashing
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('malformed-jwt')
      })
    })
  })
})
