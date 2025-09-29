import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'

// Mock Navigate component
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, replace }) => {
      mockNavigate(to, replace)
      return <div data-testid="navigate" data-to={to} data-replace={replace} />
    }
  }
})

describe('ProtectedRoute Component', () => {
  const TestChild = () => <div data-testid="protected-content">Protected Content</div>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication Check', () => {
    it('should redirect to home when no token is present', () => {
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should render children when token is present', () => {
      localStorage.setItem('accessToken', 'valid-token')
      localStorage.setItem('role', 'user')

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Role-based Access Control', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'valid-token')
    })

    it('should allow access when user has required role (string)', () => {
      localStorage.setItem('role', 'admin')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should allow access when user has one of required roles (array)', () => {
      localStorage.setItem('role', 'sales')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole={['admin', 'sales']}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should redirect admin to /admin when role not allowed', () => {
      localStorage.setItem('role', 'admin')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="sales">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/admin', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect sales to /products when role not allowed', () => {
      localStorage.setItem('role', 'sales')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/products', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect customer to home when role not allowed', () => {
      localStorage.setItem('role', 'customer')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect unknown role to home when role not allowed', () => {
      localStorage.setItem('role', 'unknown')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })

  describe('Role-based Redirection from Root', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'valid-token')
    })

    it('should redirect admin from root to /admin', () => {
      localStorage.setItem('role', 'admin')

      render(
        <MemoryRouter initialEntries={['/']}>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/admin', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should redirect sales from root to /products', () => {
      localStorage.setItem('role', 'sales')

      render(
        <MemoryRouter initialEntries={['/']}>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/products', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should not redirect customer from root', () => {
      localStorage.setItem('role', 'customer')

      render(
        <MemoryRouter initialEntries={['/']}>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should not redirect from non-root paths', () => {
      localStorage.setItem('role', 'admin')

      render(
        <MemoryRouter initialEntries={['/some-other-path']}>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null token', () => {
      localStorage.setItem('accessToken', null)

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle empty token', () => {
      localStorage.setItem('accessToken', '')

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle null role', () => {
      localStorage.setItem('accessToken', 'valid-token')
      localStorage.setItem('role', null)

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle empty role', () => {
      localStorage.setItem('accessToken', 'valid-token')
      localStorage.setItem('role', '')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole="admin">
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should handle empty requireRole array', () => {
      localStorage.setItem('accessToken', 'valid-token')
      localStorage.setItem('role', 'admin')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole={[]}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/admin', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })

    it('should render multiple children', () => {
      localStorage.setItem('accessToken', 'valid-token')
      localStorage.setItem('role', 'user')

      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div data-testid="child1">Child 1</div>
            <div data-testid="child2">Child 2</div>
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Complex Role Requirements', () => {
    beforeEach(() => {
      localStorage.setItem('accessToken', 'valid-token')
    })

    it('should handle multiple roles in array requirement', () => {
      localStorage.setItem('role', 'manager')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole={['admin', 'manager', 'supervisor']}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should reject role not in array requirement', () => {
      localStorage.setItem('role', 'user')

      render(
        <MemoryRouter>
          <ProtectedRoute requireRole={['admin', 'manager', 'supervisor']}>
            <TestChild />
          </ProtectedRoute>
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/', true)
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
    })
  })
})
