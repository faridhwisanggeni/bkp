import React, { useState, useEffect } from 'react'
import { Search, Eye, Edit, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import orderApi from '../api/orderClient'
import { useToast, formatErrorMessage } from '../components/Toast'

const Orders = () => {
  const { showSuccess, showError, showInfo } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

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
        return <XCircle size={16} style={{ color: '#ef4444' }} />
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
        return '#ef4444'
    }
  }

  // Fetch all orders (admin view)
  const fetchOrders = async () => {
    try {
      setLoading(true)
      // Since we don't have a "get all orders" endpoint, we'll use a mock approach
      // In a real scenario, you'd have GET /api/orders endpoint
      const mockOrders = [
        {
          id: '1',
          order_id: 'ORD-001',
          username: 'john_doe',
          order_date: new Date().toISOString(),
          order_status: 'pending',
          total_harga: 1299.99,
          order_details: [
            {
              id: '1',
              id_product: 1,
              qty: 1,
              original_price: 1299.99,
              id_promo: 1,
              deduct_price: 195.00,
              total_price: 1104.99
            }
          ]
        },
        {
          id: '2',
          order_id: 'ORD-002',
          username: 'jane_smith',
          order_date: new Date(Date.now() - 86400000).toISOString(),
          order_status: 'processed',
          total_harga: 899.99,
          order_details: [
            {
              id: '2',
              id_product: 2,
              qty: 1,
              original_price: 899.99,
              id_promo: null,
              deduct_price: 0,
              total_price: 899.99
            }
          ]
        }
      ]
      setOrders(mockOrders)
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

  // Handle view order
  const handleView = (order) => {
    setModalType('view')
    setSelectedOrder(order)
    setShowModal(true)
  }

  // Handle update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await orderApi.put(`/api/orders/${orderId}/status`, {
        status: newStatus
      })

      if (response.data.success) {
        showSuccess('Order status updated successfully!')
        fetchOrders()
        setShowModal(false)
      } else {
        showError('Failed to update order status: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      showError(formatErrorMessage(error))
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            Order Management
          </h1>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
            Manage customer orders and track order status
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder="Search by username or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            outline: 'none',
            backgroundColor: 'white'
          }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            No orders found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Order ID
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Customer
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Items
                  </th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '500', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: 'white', divide: '1px solid #f3f4f6' }}>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {order.order_id}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                        {order.username}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {formatDate(order.order_date)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getStatusIcon(order.order_status)}
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          color: getStatusColor(order.order_status),
                          textTransform: 'capitalize'
                        }}>
                          {order.order_status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827' }}>
                        {formatPrice(order.total_harga)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem' }}>
                      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {order.order_details?.length || 0} item(s)
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleView(order)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Eye size={12} />
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>
                Order Details
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '0.25rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '0.25rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Order ID</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedOrder.order_id}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Customer</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{selectedOrder.username}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Order Date</label>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{formatDate(selectedOrder.order_date)}</p>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {getStatusIcon(selectedOrder.order_status)}
                    <span style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                      {selectedOrder.order_status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {['pending', 'processed', 'done'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedOrder.order_id, status)}
                      disabled={selectedOrder.order_status === status}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: selectedOrder.order_status === status ? '#e5e7eb' : '#3b82f6',
                        color: selectedOrder.order_status === status ? '#6b7280' : 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: selectedOrder.order_status === status ? 'not-allowed' : 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Order Items</label>
                <div style={{ marginTop: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                  {selectedOrder.order_details?.map((item, index) => (
                    <div key={index} style={{
                      padding: '0.75rem',
                      borderBottom: index < selectedOrder.order_details.length - 1 ? '1px solid #f3f4f6' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '500' }}>
                          Product ID: {item.id_product}
                        </p>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                          Qty: {item.qty} × {formatPrice(item.original_price)}
                          {item.id_promo && (
                            <span style={{ color: '#059669' }}>
                              {' '}(Promo: -{formatPrice(item.deduct_price)})
                            </span>
                          )}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                          {formatPrice(item.total_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Total</span>
                    <span style={{ fontSize: '1rem', fontWeight: '700', color: '#111827' }}>
                      {formatPrice(selectedOrder.total_harga)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Orders
