import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle, ShoppingBag } from 'lucide-react'
import orderApi from '../api/orderClient'
import { useToast, formatErrorMessage } from '../components/Toast'

const OrderHistory = () => {
  const navigate = useNavigate()
  const { showError } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} style={{ color: '#f59e0b' }} />
      case 'processed':
        return <Package size={16} style={{ color: '#3b82f6' }} />
      case 'done':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'processed':
        return '#3b82f6'
      case 'done':
        return '#10b981'
      default:
        return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Pending'
      case 'processed':
        return 'Being Processed'
      case 'done':
        return 'Completed'
      default:
        return 'Unknown'
    }
  }

  // Fetch user orders
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const username = user.username || 'guest'

      const response = await orderApi.get(`/api/orders/user/${username}`)
      
      if (response.data.success) {
        setOrders(response.data.data || [])
      } else {
        showError('Failed to fetch orders: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      showError(formatErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        padding: '1rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#374151'
              }}
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>
              My Orders
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1.5rem'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            color: '#6b7280'
          }}>
            <div style={{ textAlign: 'center' }}>
              <Package size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Loading your orders...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <ShoppingBag size={64} style={{ marginBottom: '1rem', opacity: 0.3 }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No Orders Yet
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              You haven't placed any orders yet. Start shopping to see your order history here.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => (
              <div key={order.id} style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                {/* Order Header */}
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: '0 0 0.5rem 0'
                    }}>
                      Order #{order.order_id?.slice(-8) || 'N/A'}
                    </h3>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: 0
                    }}>
                      Placed on {formatDate(order.order_date)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {getStatusIcon(order.order_status)}
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: getStatusColor(order.order_status)
                      }}>
                        {getStatusText(order.order_status)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {formatPrice(order.total_harga)}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ padding: '1.5rem' }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '0 0 1rem 0'
                  }}>
                    Order Items ({order.order_details?.length || 0})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.order_details?.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '0.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Package size={24} style={{ color: '#9ca3af' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h5 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Product ID: {item.id_product}
                          </h5>
                          <p style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            margin: '0 0 0.25rem 0'
                          }}>
                            Quantity: {item.qty} × {formatPrice(item.original_price)}
                          </p>
                          {item.id_promo && (
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#059669',
                              margin: 0
                            }}>
                              Promotion Applied: -{formatPrice(item.deduct_price)}
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderHistory
