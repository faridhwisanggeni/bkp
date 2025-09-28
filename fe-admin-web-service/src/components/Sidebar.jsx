import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  Users, 
  Shield, 
  Home, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu
} from 'lucide-react'

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const menuItems = [
    {
      name: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      badge: null
    },
    {
      name: 'Users',
      icon: Users,
      path: '/users',
      badge: null
    },
    {
      name: 'Roles',
      icon: Shield,
      path: '/roles',
      badge: null
    },
    {
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      badge: null
    }
  ]

  return (
    <aside className={`${isCollapsed ? 'w-16' : 'w-64'} bg-slate-900 min-h-[calc(100vh-64px)] transition-all duration-300 ease-in-out shadow-lg`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-white font-semibold">Admin Panel</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-item ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className={`${isCollapsed ? 'justify-center' : 'justify-between'} flex items-center p-3 bg-slate-800 rounded-lg`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">U</span>
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-white font-medium text-sm">Admin User</p>
                <p className="text-slate-400 text-xs">admin@example.com</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Settings size={16} className="text-slate-400 hover:text-white cursor-pointer transition-colors" />
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
