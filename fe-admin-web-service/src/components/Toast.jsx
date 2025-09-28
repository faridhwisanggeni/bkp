import React, { useState, useEffect, createContext, useContext } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

// Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (message, duration) => addToast(message, 'success', duration)
  const showError = (message, duration) => addToast(message, 'error', duration)
  const showWarning = (message, duration) => addToast(message, 'warning', duration)
  const showInfo = (message, duration) => addToast(message, 'info', duration)

  return (
    <ToastContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeToast
    }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}

// Individual Toast Item
const ToastItem = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const getToastStyles = () => {
    const baseStyles = {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      maxWidth: '100%',
      wordBreak: 'break-word'
    }

    const typeStyles = {
      success: {
        backgroundColor: '#f0fdf4',
        borderLeft: '4px solid #22c55e',
        color: '#166534'
      },
      error: {
        backgroundColor: '#fef2f2',
        borderLeft: '4px solid #ef4444',
        color: '#991b1b'
      },
      warning: {
        backgroundColor: '#fffbeb',
        borderLeft: '4px solid #f59e0b',
        color: '#92400e'
      },
      info: {
        backgroundColor: '#eff6ff',
        borderLeft: '4px solid #3b82f6',
        color: '#1e40af'
      }
    }

    return { ...baseStyles, ...typeStyles[toast.type] }
  }

  const getIcon = () => {
    const iconProps = { size: 20, style: { flexShrink: 0, marginTop: '0.125rem' } }
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} style={{ ...iconProps.style, color: '#22c55e' }} />
      case 'error':
        return <XCircle {...iconProps} style={{ ...iconProps.style, color: '#ef4444' }} />
      case 'warning':
        return <AlertCircle {...iconProps} style={{ ...iconProps.style, color: '#f59e0b' }} />
      case 'info':
      default:
        return <Info {...iconProps} style={{ ...iconProps.style, color: '#3b82f6' }} />
    }
  }

  return (
    <div style={getToastStyles()}>
      {getIcon()}
      <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: '1.25rem' }}>
        {toast.message}
      </div>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          borderRadius: '0.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0.7}
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Utility function to format error messages
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  
  if (error?.response?.data?.details) {
    if (Array.isArray(error.response.data.details)) {
      return error.response.data.details.join(', ')
    }
    return error.response.data.details
  }
  
  if (error?.message) {
    // Make common error messages more user-friendly
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to server. Please check your internet connection.'
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.'
    }
    if (error.message.includes('401')) {
      return 'Your session has expired. Please log in again.'
    }
    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.'
    }
    if (error.message.includes('404')) {
      return 'The requested resource was not found.'
    }
    if (error.message.includes('500')) {
      return 'Server error occurred. Please try again later.'
    }
    return error.message
  }
  
  return 'An unexpected error occurred. Please try again.'
}
