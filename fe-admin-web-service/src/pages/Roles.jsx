import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, MoreHorizontal, Shield } from 'lucide-react'
import api from '../api/client'
import { useToast, formatErrorMessage } from '../components/Toast'

const Roles = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedRole, setSelectedRole] = useState(null)
  const [formData, setFormData] = useState({
    role_name: '',
    is_active: true
  })

  // Mock data for now - will be replaced with API calls
  const mockRoles = [
    {
      id: 1,
      name: 'Admin',
      user_count: 2,
      is_active: true,
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Sales',
      user_count: 5,
      is_active: true,
      created_at: '2024-01-16T14:20:00Z'
    },
    {
      id: 3,
      name: 'Customer',
      user_count: 150,
      is_active: true,
      created_at: '2024-01-17T09:15:00Z'
    }
  ]


  // Fetch roles from API with user counts
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      // Fetch roles and users in parallel to calculate user counts
      const [rolesResponse, usersResponse] = await Promise.all([
        fetch('http://localhost:3000/api/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      const rolesData = await rolesResponse.json()
      const usersData = await usersResponse.json()
      
      if (rolesData.roles) {
        // Calculate user count for each role
        const userCountByRole = {}
        if (usersData.users) {
          usersData.users.forEach(user => {
            userCountByRole[user.role_id] = (userCountByRole[user.role_id] || 0) + 1
          })
        }
        
        // Map API response to match our frontend format
        const mappedRoles = rolesData.roles.map(role => ({
          id: role.id,
          name: role.role_name,
          user_count: userCountByRole[role.id] || 0,
          is_active: role.is_active,
          created_at: role.created_at
        }))
        setRoles(mappedRoles)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      showError(formatErrorMessage(error))
      // Fallback to mock data if API fails
      setRoles(mockRoles)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Close modal and reset state
  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setSelectedRole(null)
    setFormData({
      role_name: '',
      is_active: true
    })
  }

  // Handle create role
  const handleCreate = () => {
    setModalType('create')
    setFormData({
      role_name: '',
      is_active: true
    })
    setShowModal(true)
  }

  // Handle edit role
  const handleEdit = (role) => {
    setModalType('edit')
    setSelectedRole(role)
    setFormData({
      role_name: role.name,
      is_active: role.is_active
    })
    setShowModal(true)
  }

  // Handle view role
  const handleView = (role) => {
    setModalType('view')
    setSelectedRole(role)
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken')
      const url = modalType === 'create' 
        ? 'http://localhost:3000/api/roles'
        : `http://localhost:3000/api/roles/${selectedRole.id}`
      
      const method = modalType === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      // Check if response is successful (200-299 status codes)
      if (response.ok) {
        showSuccess(`Role ${modalType === 'create' ? 'created' : 'updated'} successfully!`)
        fetchRoles() // Refresh the list
        closeModal()
      } else {
        // Handle error response
        const errorMessage = data.message || data.error || `Failed to ${modalType} role`
        showError(`Error ${modalType === 'create' ? 'creating' : 'updating'} role: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Error ${modalType === 'create' ? 'creating' : 'updating'} role:`, error)
      showError(formatErrorMessage(error))
    }
  }


  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Role Management
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
            Manage user roles and access levels
          </p>
        </div>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)'
        }}
        onClick={handleCreate}
        >
          <Plus size={20} />
          Add Role
        </button>
      </div>

      {/* Search */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search roles..."
            style={{
              width: '100%',
              paddingLeft: '2.75rem',
              paddingRight: '1rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Roles Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>Roles ({filteredRoles.length})</h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Role</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Users</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Status</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Loading roles...
                  </td>
                </tr>
              ) : filteredRoles.map((role) => (
                <tr key={role.id} style={{
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.parentElement.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.target.parentElement.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Shield size={20} style={{ color: '#6b7280' }} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827',
                          margin: 0
                        }}>{role.name}</p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: 0
                        }}>{role.description}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>{role.user_count}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: role.is_active ? '#059669' : '#dc2626',
                      backgroundColor: role.is_active ? '#dcfce7' : '#fee2e2',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      {role.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }}
                      onClick={() => handleView(role)}
                      >
                        <Eye size={16} style={{ color: '#6b7280' }} />
                      </button>
                      <button style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e5e7eb'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }}
                      onClick={() => handleEdit(role)}
                      >
                        <Edit size={16} style={{ color: '#6b7280' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRoles.length === 0 && !loading && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Shield size={48} style={{ margin: '0 auto 1rem auto', color: '#d1d5db' }} />
            <p style={{ fontSize: '1rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
              No roles found
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Add your first role to get started
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              {modalType === 'create' ? 'Add New Role' : 
               modalType === 'edit' ? 'Edit Role' : 'Role Details'}
            </h2>

            {modalType === 'view' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Role Name</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedRole?.name}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Users</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedRole?.user_count} users assigned</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Status</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedRole?.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={formData.role_name}
                    onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Active
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {modalType === 'create' ? 'Create Role' : 'Update Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Roles
