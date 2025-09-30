import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle } from 'lucide-react'
import api from '../api/client'
import { useToast, formatErrorMessage } from '../components/Toast'

function Login() {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('ChangeMeAdmin123!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      const res = await response.json()
      const { accessToken, refreshToken } = res.data
      
      // Decode payload to get role
      const payload = JSON.parse(atob(accessToken.split('.')[1]))
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      if (payload?.role) localStorage.setItem('role', payload.role)
      
      // Show success message
      showSuccess(`Welcome back! Have a nice day`)
      
      // Redirect based on role
      switch (payload.role) {
        case 'admin':
          navigate('/users')
          break
        case 'sales':
          navigate('/products')
          break
        case 'customer':
          navigate('/')
          break
        default:
          navigate('/')
      }
    } catch (err) {
      const errorMessage = formatErrorMessage(err)
      showError(errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { email: 'admin@example.com', password: 'ChangeMeAdmin123!', role: 'Admin' },
    { email: 'sales@example.com', password: 'ChangeMeSales123!', role: 'Sales' },
    { email: 'customer@example.com', password: 'ChangeMeCustomer123!', role: 'Customer' }
  ]

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.3
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        zIndex: 1
      }}>
        {/* Login Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)'
            }}>
              <Shield size={40} style={{ color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 0.5rem 0'
            }}>Welcome Back</h1>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              margin: 0
            }}>Sign in to your admin dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Email Field */}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: '2.75rem',
                    paddingTop: '0.75rem',
                    paddingBottom: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea'
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db'
                    e.target.style.boxShadow = 'none'
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#dc2626',
                fontSize: '0.875rem'
              }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 8px 25px 0 rgba(102, 126, 234, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.3)'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>Demo Accounts</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillDemo(account)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    backgroundColor: '#f9fafb',
                    fontSize: '0.75rem',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6'
                    e.target.style.borderColor = '#d1d5db'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f9fafb'
                    e.target.style.borderColor = '#e5e7eb'
                  }}
                >
                  <strong>{account.role}:</strong> {account.email}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.875rem'
        }}>
          <p style={{ margin: 0 }}>© 2024 Admin Dashboard. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
