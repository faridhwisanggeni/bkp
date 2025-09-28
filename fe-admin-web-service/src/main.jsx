import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Sales from './pages/Sales'
import Product from './pages/Product'
import Promotion from './pages/Promotion'
import Roles from './pages/Roles'
import Users from './pages/Users'
import Orders from './pages/Orders'
import OrderHistory from './pages/OrderHistory'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastProvider } from './components/Toast'
import './styles.css'
import './admin-styles.css'

// Helper component to check if user is logged in and redirect accordingly
const RoleBasedHome = () => {
  const token = localStorage.getItem('accessToken')
  const role = localStorage.getItem('role')
  
  // If not logged in, show public home page
  if (!token) {
    return <Home />
  }
  
  // If logged in, redirect based on role
  switch (role) {
    case 'admin':
      return <Navigate to="/admin" replace />
    case 'sales':
      return <Navigate to="/products" replace />
    case 'customer':
      return <Home />
    default:
      return <Home />
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleBasedHome />} />
        <Route path="/order-history" element={<OrderHistory />} />
        
        {/* Sales Routes */}
        <Route
          path="/sales"
          element={
            <ProtectedRoute requireRole="sales">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Sales />} />
        </Route>
        
        <Route
          path="/products"
          element={
            <ProtectedRoute requireRole="sales">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Product />} />
        </Route>
        
        <Route
          path="/promotions"
          element={
            <ProtectedRoute requireRole="sales">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Promotion />} />
        </Route>
        
        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireRole="admin">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>
        
        <Route
          path="/roles"
          element={
            <ProtectedRoute requireRole="admin">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Roles />} />
        </Route>
        
        <Route
          path="/users"
          element={
            <ProtectedRoute requireRole="admin">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Users />} />
        </Route>
        
        <Route
          path="/orders"
          element={
            <ProtectedRoute requireRole={["admin", "sales"]}>
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Orders />} />
        </Route>
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute requireRole="admin">
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Settings />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
)
