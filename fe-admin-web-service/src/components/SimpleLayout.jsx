import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  Users, 
  Shield, 
  Home, 
  LogOut,
  Package,
  Tag,
  BarChart3,
  ShoppingBag
} from 'lucide-react'

const SimpleLayout = () => {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  // Sidebar is always open per requirements

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('role')
    navigate('/login', { replace: true })
  }

  // Menu items based on role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Users', icon: Users, path: '/users' },
          { name: 'Roles', icon: Shield, path: '/roles' }
        ]
      case 'sales':
        return [
          { name: 'Products', icon: Package, path: '/products' },
          { name: 'Promotions', icon: Tag, path: '/promotions' },
          { name: 'Orders', icon: ShoppingBag, path: '/orders' }
        ]
      default:
        return []
    }
  }

  const menuItems = getMenuItems()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
            Admin Dashboard
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', paddingTop: '64px' }}>
        {/* Sidebar */}
        <aside style={{
          width: '256px',
          backgroundColor: '#0f172a',
          minHeight: 'calc(100vh - 64px)',
          transition: 'width 0.3s ease-in-out',
          position: 'fixed',
          left: 0,
          top: '64px',
          zIndex: 40,
          boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Sidebar Header */}
          {/* <div style={{
            padding: '1rem',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}> */}
            {/* Removed logo text per requirements */}
          {/* </div> */}

          {/* Navigation */}
          <nav style={{ padding: '1rem' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                    <NavLink
                      to={item.path}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        justifyContent: 'flex-start',
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.5rem',
                        textDecoration: 'none',
                        color: isActive ? '#ffffff' : '#cbd5e1',
                        backgroundColor: isActive ? '#3b82f6' : 'transparent',
                        fontWeight: '500',
                        transition: 'all 0.2s ease-in-out',
                        position: 'relative'
                      })}
                      onMouseEnter={(e) => {
                        if (!e.target.style.backgroundColor.includes('rgb(59, 130, 246)')) {
                          e.target.style.backgroundColor = '#334155'
                          e.target.style.color = '#ffffff'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!e.target.style.backgroundColor.includes('rgb(59, 130, 246)')) {
                          e.target.style.backgroundColor = 'transparent'
                          e.target.style.color = '#cbd5e1'
                        }
                      }}
                    >
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            right: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              justifyContent: 'flex-start',
              padding: '0.75rem',
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>U</div>
              <div>
                <p style={{ color: 'white', fontWeight: '500', fontSize: '0.875rem', margin: 0 }}>
                  Admin User
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                  admin@example.com
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: '256px',
          transition: 'margin-left 0.3s ease-in-out',
          padding: '1.5rem'
        }}>
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {/* No mobile overlay needed since sidebar is fixed open */}

      <style jsx>{`
        @media (max-width: 768px) {
          aside {
            width: 256px !important;
          }
          main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default SimpleLayout
