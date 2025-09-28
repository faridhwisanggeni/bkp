import React, { useState, useEffect } from 'react'
import { Search, Plus, Eye, Edit, MoreHorizontal, Package } from 'lucide-react'
import api from '../api/client'
import { useToast, formatErrorMessage } from '../components/Toast'

const Product = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    qty: '',
    is_active: true
  })

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3002/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      showError(formatErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Handle create product
  const handleCreate = () => {
    setModalType('create')
    setFormData({
      product_name: '',
      price: '',
      qty: '',
      is_active: true
    })
    setShowModal(true)
  }

  // Handle edit product
  const handleEdit = (product) => {
    setModalType('edit')
    setSelectedProduct(product)
    setFormData({
      product_name: product.product_name,
      price: product.price,
      qty: product.qty,
      is_active: product.is_active
    })
    setShowModal(true)
  }

  // Handle view product
  const handleView = (product) => {
    setModalType('view')
    setSelectedProduct(product)
    setShowModal(true)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = modalType === 'create' 
        ? 'http://localhost:3002/api/products'
        : `http://localhost:3002/api/products/${selectedProduct.id}`
      
      const method = modalType === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          qty: parseInt(formData.qty)
        })
      })
      
      const data = await response.json()
      if (response.ok) {
        showSuccess(`Product ${modalType === 'create' ? 'created' : 'updated'} successfully!`)
        fetchProducts()
        setShowModal(false)
        setModalType('')
        setSelectedProduct(null)
        setFormData({
          product_name: '',
          price: '',
          qty: '',
          is_active: true
        })
      } else {
        showError(`Error ${modalType === 'create' ? 'creating' : 'updating'} product: ` + data.message)
      }
    } catch (error) {
      console.error(`Error ${modalType === 'create' ? 'creating' : 'updating'} product:`, error)
      showError(formatErrorMessage(error))
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const filteredProducts = products.filter(product => 
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Product Management
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
            Manage your product catalog and inventory
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
          Add Product
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
            placeholder="Search products..."
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

      {/* Products Table */}
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
          }}>Products ({filteredProducts.length})</h2>
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
                }}>Product</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Price</th>
                <th style={{
                  padding: '0.75rem 1.5rem',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #e2e8f0'
                }}>Stock</th>
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
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id} style={{
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
                        <Package size={20} style={{ color: '#6b7280' }} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#111827',
                          margin: 0
                        }}>{product.product_name}</p>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: 0
                        }}>ID: {product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>{formatPrice(product.price)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: product.qty > 0 ? '#374151' : '#dc2626'
                    }}>{product.qty}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: product.is_active ? '#059669' : '#dc2626',
                      backgroundColor: product.is_active ? '#dcfce7' : '#fee2e2',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      {product.is_active ? 'Active' : 'Inactive'}
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
                      onClick={() => handleView(product)}
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
                      onClick={() => handleEdit(product)}
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

        {products.length === 0 && !loading && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <Package size={48} style={{ margin: '0 auto 1rem auto', color: '#d1d5db' }} />
            <p style={{ fontSize: '1rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
              No products found
            </p>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              Add your first product to get started
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600' }}>
              {modalType === 'create' ? 'Add New Product' : 
               modalType === 'edit' ? 'Edit Product' : 'Product Details'}
            </h2>

            {modalType === 'view' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Product Name</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedProduct?.product_name}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Price</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{formatPrice(selectedProduct?.price)}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Quantity</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedProduct?.qty}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Status</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedProduct?.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Created At</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{new Date(selectedProduct?.created_at).toLocaleDateString()}</p>
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
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
                    Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.qty}
                    onChange={(e) => setFormData({...formData, qty: e.target.value})}
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
                    {modalType === 'create' ? 'Create Product' : 'Update Product'}
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

export default Product
