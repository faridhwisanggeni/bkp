import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, requireRole }) {
  const token = localStorage.getItem('accessToken')
  const role = localStorage.getItem('role')
  const location = useLocation()
  
  // If no token, redirect to home (public page)
  if (!token) return <Navigate to="/" replace />
  
  // If specific role required and user doesn't have it, redirect based on their role
  if (requireRole) {
    const allowedRoles = Array.isArray(requireRole) ? requireRole : [requireRole]
    if (!allowedRoles.includes(role)) {
      switch (role) {
        case 'admin':
          return <Navigate to="/admin" replace />
        case 'sales':
          return <Navigate to="/products" replace />
        case 'customer':
          return <Navigate to="/" replace />
        default:
          return <Navigate to="/" replace />
      }
    }
  }
  
  // Redirect based on role if no specific path
  if (location.pathname === '/') {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />
    } else if (role === 'sales') {
      return <Navigate to="/products" replace />
    }
  }
  
  return children
}
