import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, MoreHorizontal } from 'lucide-react'
import api from '../api/client'
import { useToast, formatErrorMessage } from '../components/Toast'

const Promotion = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedPromotion, setSelectedPromotion] = useState(null)
  const [formData, setFormData] = useState({
    product_id: '',
    promotion_name: '',
    promotion_type: 'discount',
    discount: '',
    qty_max: '',
    is_active: true,
    started_at: '',
    ended_at: ''
  })

  const promotionTypes = [
    { value: 'discount', label: 'Discount' },
    { value: 'cashback', label: 'Cashback' }
  ]

  // Fetch promotions from API
  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3002/api/promotions')
      const data = await response.json()
      if (data.success) {
        setPromotions(data.data)
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  useEffect(() => {
    fetchPromotions()
    fetchProducts()
  }, [])

  // Handle create promotion
  const handleCreate = () => {
    setModalType('create')
    setFormData({
      product_id: '',
      promotion_name: '',
      promotion_type: 'discount',
      discount: '',
      qty_max: '',
      is_active: true,
      started_at: '',
      ended_at: ''
    })
    setShowModal(true)
  }

  // Handle edit promotion
  const handleEdit = (promotion) => {
    setModalType('edit')
    setSelectedPromotion(promotion)
    setFormData({
      product_id: promotion.product_id,
      promotion_name: promotion.promotion_name,
      promotion_type: promotion.promotion_type,
      discount: promotion.discount,
      qty_max: promotion.qty_max,
      is_active: promotion.is_active,
      started_at: promotion.started_at ? promotion.started_at.split('T')[0] : '',
      ended_at: promotion.ended_at ? promotion.ended_at.split('T')[0] : ''
    })
    setShowModal(true)
  }

  // Handle view promotion
  const handleView = (promotion) => {
    setModalType('view')
    setSelectedPromotion(promotion)
    setShowModal(true)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Frontend validation for dates
    const startDate = new Date(formData.started_at)
    const endDate = new Date(formData.ended_at)
    
    if (endDate < startDate) {
      showError('End date cannot be earlier than start date. Please select a valid date range.')
      return
    }
    
    try {
      const url = modalType === 'create' 
        ? 'http://localhost:3002/api/promotions'
        : `http://localhost:3002/api/promotions/${selectedPromotion.id}`
      
      const method = modalType === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          product_id: parseInt(formData.product_id),
          discount: parseInt(formData.discount),
          qty_max: parseInt(formData.qty_max),
          started_at: new Date(formData.started_at).toISOString(),
          ended_at: new Date(formData.ended_at).toISOString()
        })
      })
      
      const data = await response.json()
      if (data.success) {
        showSuccess(`Promotion ${modalType === 'create' ? 'created' : 'updated'} successfully!`)
        fetchPromotions()
        setShowModal(false)
        setModalType('')
        setSelectedPromotion(null)
        setFormData({
          product_id: '',
          promotion_name: '',
          promotion_type: 'discount',
          discount: '',
          qty_max: '',
          is_active: true,
          started_at: '',
          ended_at: ''
        })
      } else {
        // Handle specific error messages
        let errorMessage = data.message || 'Unknown error occurred'
        
        if (errorMessage.includes('check constraint "check_promotion_dates"')) {
          errorMessage = 'End date must be greater than or equal to start date.'
        } else if (errorMessage.includes('Validation error')) {
          if (data.details && Array.isArray(data.details)) {
            errorMessage = data.details.join(', ')
          } else {
            errorMessage = 'Please check your input data and try again.'
          }
        } else if (errorMessage.includes('duplicate key')) {
          errorMessage = 'A promotion with this name already exists.'
        } else if (errorMessage.includes('foreign key')) {
          errorMessage = 'Selected product is not valid.'
        }
        
        showError(`Error ${modalType === 'create' ? 'creating' : 'updating'} promotion: ${errorMessage}`)
      }
    } catch (error) {
      console.error(`Error ${modalType === 'create' ? 'creating' : 'updating'} promotion:`, error)
      showError(formatErrorMessage(error))
    }
  }

  const filteredPromotions = promotions.filter(promotion => 
    promotion.promotion_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Promotion Management
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
            Manage your promotional campaigns and offers
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
          cursor: 'pointer'
        }}
        onClick={handleCreate}
        >
          <Plus size={20} />
          Add Promotion
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
            placeholder="Search promotions..."
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

      {/* Promotions Table */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: 0 }}>
            Promotions ({filteredPromotions.length})
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280' }}>Promotion</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280' }}>Type</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280' }}>Discount</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280' }}>Status</th>
                <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                    Loading promotions...
                  </td>
                </tr>
              ) : filteredPromotions.map((promotion) => (
                <tr key={promotion.id}>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', margin: 0 }}>
                        {promotion.promotion_name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                        Product: {promotion.product_name}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                      {promotion.promotion_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                      {promotion.promotion_type === 'discount' 
                        ? `${promotion.discount}%` 
                        : `${promotion.discount.toLocaleString('id-ID')}`}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: promotion.is_active ? '#059669' : '#dc2626',
                      backgroundColor: promotion.is_active ? '#dcfce7' : '#fee2e2',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      {promotion.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleView(promotion)}
                      >
                        <Eye size={16} style={{ color: '#6b7280' }} />
                      </button>
                      <button style={{
                        padding: '0.375rem',
                        border: 'none',
                        borderRadius: '0.375rem',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleEdit(promotion)}
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              {modalType === 'create' ? 'Add New Promotion' : 
               modalType === 'edit' ? 'Edit Promotion' : 'Promotion Details'}
            </h2>

            {modalType === 'view' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Promotion Name</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedPromotion?.promotion_name}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Product</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedPromotion?.product_name}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Type</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedPromotion?.promotion_type}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                    {selectedPromotion?.promotion_type === 'discount' ? 'Discount' : 'Cashback Amount'}
                  </label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                    {selectedPromotion?.promotion_type === 'discount' 
                      ? `${selectedPromotion?.discount}%` 
                      : `${selectedPromotion?.discount?.toLocaleString('id-ID')}`}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Status</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedPromotion?.is_active ? 'Active' : 'Inactive'}</p>
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
                    Product *
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({...formData, product_id: e.target.value})}
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
                  >
                    <option value="">Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.product_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Promotion Name *
                  </label>
                  <input
                    type="text"
                    value={formData.promotion_name}
                    onChange={(e) => setFormData({...formData, promotion_name: e.target.value})}
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Type *
                  </label>
                  <select
                    value={formData.promotion_type}
                    onChange={(e) => setFormData({...formData, promotion_type: e.target.value})}
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
                  >
                    {promotionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    {formData.promotion_type === 'discount' ? 'Discount (%) *' : 'Cashback Amount (USD) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.promotion_type === 'discount' ? "100" : undefined}
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    placeholder={formData.promotion_type === 'discount' ? 'e.g., 10 for 10%' : 'e.g., 1000000 for 1,000,000'}
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Max Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.qty_max}
                    onChange={(e) => setFormData({...formData, qty_max: e.target.value})}
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.started_at}
                    onChange={(e) => setFormData({...formData, started_at: e.target.value})}
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.ended_at}
                    onChange={(e) => setFormData({...formData, ended_at: e.target.value})}
                    required
                    min={formData.started_at}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: formData.started_at && formData.ended_at && new Date(formData.ended_at) < new Date(formData.started_at) 
                        ? '1px solid #ef4444' 
                        : '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {formData.started_at && formData.ended_at && new Date(formData.ended_at) < new Date(formData.started_at) && (
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      margin: '0.25rem 0 0 0'
                    }}>
                      End date cannot be earlier than start date
                    </p>
                  )}
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
                    {modalType === 'create' ? 'Create Promotion' : 'Update Promotion'}
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

export default Promotion
