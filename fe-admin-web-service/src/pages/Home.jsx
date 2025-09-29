import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, ShoppingCart, Star, Plus, Minus, X, Tag, Package } from 'lucide-react'
import productApi from '../api/productClient'
import orderApi from '../api/orderClient'
import { useToast, formatErrorMessage } from '../components/Toast'

const Home = () => {
  const navigate = useNavigate()
  const { showSuccess, showError, showInfo } = useToast()
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on component mount
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : []
  })
  const [showCart, setShowCart] = useState(false)
  const [showPromoDetail, setShowPromoDetail] = useState(false)
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [promotions, setPromotions] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // Fetch promotions and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promoRes, productRes] = await Promise.all([
          productApi.get('/api/promotions'),
          productApi.get('/api/products')
        ])
        setPromotions(promoRes.data.data || [])
        setProducts(productRes.data.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback data
        setPromotions([
          {
            id: 1,
            promotion_name: 'Flash Sale Weekend - Laptop Gaming',
            discount: 15,
            product_name: 'Laptop Gaming ROG',
            price: 1299.99
          }
        ])
        setProducts([
          {
            id: 1,
            product_name: 'Laptop Gaming ROG',
            price: 1299.99,
            qty: 25
          },
          {
            id: 2,
            product_name: 'iPhone 15 Pro',
            price: 999.99,
            qty: 12
          }
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Cart functions
  const addToCart = (product, promotion = null) => {
    if (isAddingToCart) return // Prevent multiple calls
    
    setIsAddingToCart(true)
    
    setTimeout(() => {
      const cartKey = promotion ? `${product.id}_promo_${promotion.id}` : `${product.id}`
      const existingItem = cart.find(item => item.cartKey === cartKey)
      
      if (existingItem) {
        showInfo(`Updated ${product.product_name} quantity in cart`)
        setCart(prevCart =>
          prevCart.map(item =>
            item.cartKey === cartKey
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        )
      } else {
        const cartItem = {
          ...product,
          cartKey,
          quantity: 1,
          promotion: promotion ? {
            id: promotion.id,
            name: promotion.promotion_name,
            type: promotion.promotion_type,
            discount: promotion.discount
          } : null
        }
        
        const promoText = promotion ? ` with ${promotion.promotion_type === 'discount' ? promotion.discount + '% discount' : 'cashback'}` : ''
        showSuccess(`${product.product_name}${promoText} added to cart!`)
        setCart(prevCart => [...prevCart, cartItem])
      }
      
      setIsAddingToCart(false)
    }, 100)
  }

  const removeFromCart = (cartKey) => {
    setCart(prevCart => prevCart.filter(item => item.cartKey !== cartKey))
  }

  const updateQuantity = (cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartKey)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartKey === cartKey
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const getItemPrice = (item) => {
    let itemPrice = item.price
    if (item.promotion) {
      if (item.promotion.type === 'discount') {
        // Discount: harga original dikali (100 - discount) / 100
        itemPrice = item.price * (1 - item.promotion.discount / 100)
      } else if (item.promotion.type === 'cashback') {
        // Cashback: harga original dikurangi cashback amount
        itemPrice = item.price - item.promotion.discount
      }
    }
    return itemPrice
  }

  const getItemCashback = (item) => {
    // Cashback sudah dihitung di getItemPrice, jadi return 0 untuk avoid double calculation
    return 0
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemTotal = getItemPrice(item) * item.quantity
      return total + itemTotal
    }, 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  // Handle promo click
  const handlePromoClick = (promo) => {
    setSelectedPromo(promo)
    setShowPromoDetail(true)
  }

  // Add product from promo to cart
  const addPromoToCart = () => {
    if (selectedPromo) {
      // Find the product associated with this promotion
      const product = products.find(p => p.id === selectedPromo.product_id)
      if (product) {
        addToCart(product, selectedPromo)
        setShowPromoDetail(false)
      } else {
        showError('Product not found for this promotion')
      }
    }
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      showError('Your cart is empty')
      return
    }

    try {
      // Get username from JWT token
      const token = localStorage.getItem('accessToken')
      if (!token) {
        showError('Please login to place an order')
        return
      }
      
      // Decode JWT to get username
      const payload = JSON.parse(atob(token.split('.')[1]))
      const username = payload.email || 'guest'

      // Prepare order data
      const orderData = {
        username: username,
        total_harga: getTotalPrice(),
        items: cart.map(item => ({
          id_product: item.id,
          qty: item.quantity,
          original_price: item.price,
          id_promo: item.promotion?.id || null,
          deduct_price: item.promotion ? 
            (item.promotion.type === 'discount' ? 
              (item.price * item.promotion.discount / 100) : 
              item.promotion.discount
            ) : 0,
          total_price: getItemPrice(item) * item.quantity
        }))
      }

      // Create order
      const response = await orderApi.post('/api/orders', orderData)
      
      if (response.data.success) {
        const orderId = response.data.data.order_id
        showSuccess(`Order created successfully! Order ID: ${orderId.slice(-8)}`)
        setCart([]) // Clear cart (will auto-save to localStorage via useEffect)
        localStorage.removeItem('cart') // Explicitly clear cart from localStorage
        setShowCart(false)
        
        // Check order status after a delay to see if it gets cancelled
        setTimeout(async () => {
          try {
            const statusResponse = await orderApi.get(`/api/orders/${orderId}`)
            if (statusResponse.data.success) {
              const order = statusResponse.data.data
              if (order.order_status === 'cancelled') {
                showError(order.cancellation_reason || 'Order was cancelled due to stock unavailability or promotional limits exceeded')
              } else if (order.order_status === 'ready_for_payment') {
                showSuccess('Order validated successfully! You can now proceed to payment in My Orders.')
              }
            }
          } catch (statusError) {
            console.error('Error checking order status:', statusError)
          }
        }, 3000) // Check after 3 seconds
      } else {
        showError('Failed to create order: ' + response.data.message)
      }

    } catch (error) {
      console.error('Checkout error:', error)
      showError(formatErrorMessage(error))
    }
  }

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={24} style={{ color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0
            }}>BKP Commerce</h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/order-history')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'transparent',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <Package size={20} />
              My Orders
            </button>
            <button
              onClick={() => setShowCart(true)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ShoppingCart size={20} />
              Cart ({getTotalItems()})
            </button>

            {/* Sign In Button - Only show if not logged in */}
            {!localStorage.getItem('accessToken') && (
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.5rem 1.5rem',
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
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 8px 25px 0 rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 14px 0 rgba(102, 126, 234, 0.3)'
                }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.3
        }} />
        
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem',
            margin: '0 0 1rem 0'
          }}>
            Welcome to BKP Commerce
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem auto'
          }}>
            Discover amazing products with exclusive promotions and deals
          </p>

          {/* Promotions Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'white' }}>Loading promotions...</div>
            ) : promotions.length > 0 ? (
              promotions.slice(0, 3).map((promo) => (
                <div key={promo.id} 
                  onClick={() => handlePromoClick(promo)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    e.target.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Tag size={20} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>PROMO</span>
                  </div>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {promo.promotion_name}
                  </h3>
                  <p style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#fbbf24',
                    margin: '0'
                  }}>
                    {promo.discount}% OFF
                  </p>
                </div>
              ))
            ) : (
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '1rem',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center'
              }}>
                <Tag size={24} style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ margin: '0 0 0.5rem 0' }}>Special Offers</h3>
                <p style={{ margin: 0, opacity: 0.8 }}>Check back soon for amazing deals!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section style={{ padding: '4rem 0' }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '1rem',
              margin: '0 0 1rem 0'
            }}>
              Our Products
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#6b7280',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Discover our amazing collection of high-quality products
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>Loading products...</div>
            ) : products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} style={{
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-4px)'
                  e.target.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                >
                  {/* Product Image Placeholder */}
                  <div style={{
                    height: '200px',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Package size={48} style={{ color: '#9ca3af' }} />
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1f2937',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {product.product_name}
                    </h3>
                    <p style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      color: '#667eea',
                      marginBottom: '0.5rem',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {formatPrice(product.price)}
                    </p>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      marginBottom: '1rem',
                      margin: '0 0 1rem 0'
                    }}>
                      Stock: {product.qty} available
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        addToCart(product)
                      }}
                      disabled={product.qty <= 0}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: product.qty > 0 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#9ca3af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: product.qty > 0 ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s'
                      }}
                    >
                      {product.qty > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#6b7280',
                gridColumn: '1 / -1'
              }}>
                No products available at the moment
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1.5rem'
        }}>
          <p style={{ margin: 0, opacity: 0.8 }}>
            © 2024 BKP Commerce. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Cart Modal */}
      {showCart && (
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
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Shopping Cart
              </h2>
              <button
                onClick={() => setShowCart(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} style={{ color: '#6b7280' }} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: '#6b7280'
              }}>
                <ShoppingCart size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p style={{ margin: 0 }}>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  {cart.map((item) => (
                    <div key={item.cartKey} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          margin: '0 0 0.25rem 0'
                        }}>
                          {item.product_name}
                          {item.promotion && (
                            <span style={{
                              fontSize: '0.75rem',
                              backgroundColor: '#fbbf24',
                              color: 'white',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              marginLeft: '0.5rem'
                            }}>
                              {item.promotion.type === 'discount' ? `${item.promotion.discount}% OFF` : `$${item.promotion.discount} CASHBACK`}
                            </span>
                          )}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            Original: {formatPrice(item.price)}
                          </p>
                          {item.promotion && (
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#059669',
                              fontWeight: '600',
                              margin: 0
                            }}>
                              {item.promotion.type === 'discount' 
                                ? `Discount ${item.promotion.discount}%`
                                : `Cashback $${item.promotion.discount}`
                              }
                            </p>
                          )}
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#667eea',
                            fontWeight: '600',
                            margin: 0
                          }}>
                            Final: {formatPrice(getItemPrice(item))}
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        
                        <span style={{
                          minWidth: '2rem',
                          textAlign: 'center',
                          fontWeight: '600'
                        }}>
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.25rem',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.cartKey)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          padding: '0.25rem'
                        }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{
                  borderTop: '1px solid #e5e7eb',
                  paddingTop: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      Total: {formatPrice(getTotalPrice())}
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      {getTotalItems()} item(s)
                    </span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Promo Detail Modal */}
      {showPromoDetail && selectedPromo && (
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
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: 0
              }}>
                Promotion Details
              </h2>
              <button
                onClick={() => setShowPromoDetail(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} style={{ color: '#6b7280' }} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                backgroundColor: '#fbbf24',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                display: 'inline-block',
                marginBottom: '1rem'
              }}>
                <Tag size={16} style={{ marginRight: '0.5rem' }} />
                SPECIAL PROMOTION
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem',
                margin: '0 0 1rem 0'
              }}>
                {selectedPromo.promotion_name}
              </h3>

              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 0.5rem 0'
                }}>
                  Product: {products.find(p => p.id === selectedPromo.product_id)?.product_name || 'Product not found'}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  margin: '0 0 0.5rem 0'
                }}>
                  Original Price: {formatPrice(products.find(p => p.id === selectedPromo.product_id)?.price || 0)}
                </p>
                <p style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: selectedPromo.promotion_type === 'discount' ? '#059669' : '#2563eb',
                  margin: 0
                }}>
                  {selectedPromo.promotion_type === 'discount' 
                    ? `${selectedPromo.discount}% Discount`
                    : `$${selectedPromo.discount} Cashback`
                  }
                </p>
                {selectedPromo.promotion_type === 'discount' && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#059669',
                    fontWeight: '600',
                    margin: '0.5rem 0 0 0'
                  }}>
                    Final Price: {formatPrice((products.find(p => p.id === selectedPromo.product_id)?.price || 0) * (1 - selectedPromo.discount / 100))}
                  </p>
                )}
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    addPromoToCart()
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Add to Cart
                </button>
                <button
                  onClick={() => setShowPromoDetail(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
