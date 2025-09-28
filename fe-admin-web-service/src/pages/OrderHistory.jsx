import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle, ShoppingBag, CreditCard, XCircle, AlertTriangle } from 'lucide-react'
import orderApi from '../api/orderClient'
import { useToast, formatErrorMessage } from '../components/Toast'

const OrderHistory = () => {
  const navigate = useNavigate()
  const { showError, showSuccess } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [paymentData, setPaymentData] = useState({
    payment_method: 'credit_card',
    card_number: '',
    card_holder: '',
    expiry_date: '',
    cvv: ''
  })
  const [processingPayment, setProcessingPayment] = useState(false)

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
      case 'ready_for_payment':
        return <CreditCard size={16} style={{ color: '#3b82f6' }} />
      case 'completed':
        return <CheckCircle size={16} style={{ color: '#10b981' }} />
      case 'cancelled':
        return <XCircle size={16} style={{ color: '#ef4444' }} />
      case 'failed':
        return <AlertTriangle size={16} style={{ color: '#ef4444' }} />
      default:
        return <Clock size={16} style={{ color: '#6b7280' }} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'ready_for_payment':
        return '#3b82f6'
      case 'completed':
        return '#10b981'
      case 'cancelled':
        return '#ef4444'
      case 'failed':
        return '#ef4444'
      default:
        return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Order Pending'
      case 'ready_for_payment':
        return 'Ready for Payment'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      case 'failed':
        return 'Failed'
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

  // Handle payment
  const handlePayment = (order) => {
    setSelectedOrder(order)
    setShowPaymentModal(true)
    setPaymentData({
      payment_method: 'credit_card',
      card_number: '',
      card_holder: '',
      expiry_date: '',
      cvv: ''
    })
  }

  const processPayment = async () => {
    if (!selectedOrder) return

    // Validate payment data
    if (!paymentData.card_number || !paymentData.card_holder || !paymentData.expiry_date || !paymentData.cvv) {
      showError('Please fill in all payment details')
      return
    }

    try {
      setProcessingPayment(true)
      
      const response = await orderApi.post(`/api/orders/${selectedOrder.order_id}/complete-payment`, {
        payment_method: paymentData.payment_method,
        card_number: paymentData.card_number
      })

      if (response.data.success) {
        showSuccess('Payment completed successfully!')
        setShowPaymentModal(false)
        setSelectedOrder(null)
        // Refresh orders
        fetchOrders()
      } else {
        showError('Payment failed: ' + response.data.message)
      }
    } catch (error) {
      console.error('Payment error:', error)
      showError(formatErrorMessage(error))
    } finally {
      setProcessingPayment(false)
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
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
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
                    {order.order_status === 'ready_for_payment' && (
                      <button
                        onClick={() => handlePayment(order)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <CreditCard size={16} />
                        Pay Now
                      </button>
                    )}
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

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && (
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
            borderRadius: '0.75rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0 0 1rem 0'
            }}>
              Complete Payment
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                Order #{selectedOrder.order_id?.slice(-8)}
              </p>
              <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                Total: {formatPrice(selectedOrder.total_harga)}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Card Holder Name
                </label>
                <input
                  type="text"
                  value={paymentData.card_holder}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, card_holder: e.target.value }))}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={paymentData.card_number}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, card_number: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentData.expiry_date}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    placeholder="MM/YY"
                    maxLength="5"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    maxLength="4"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: processingPayment ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={processingPayment}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: processingPayment ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: processingPayment ? 'not-allowed' : 'pointer'
                }}
              >
                {processingPayment ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderHistory
