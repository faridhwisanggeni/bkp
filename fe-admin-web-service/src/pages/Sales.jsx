import React from 'react'
import { TrendingUp, DollarSign, Users, Target, BarChart3, Calendar } from 'lucide-react'

const Sales = () => {
  const salesStats = [
    {
      title: 'Total Sales',
      value: '45,231',
      change: '+12%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: 'New Leads',
      value: '1,234',
      change: '+8%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: '+0.5%',
      changeType: 'increase',
      icon: Target,
      color: 'bg-purple-500'
    },
    {
      title: 'Monthly Target',
      value: '78%',
      change: '+5%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  const recentDeals = [
    { id: 1, customer: 'PT. ABC Corp', amount: '$12,500', status: 'Closed Won', date: '2024-01-15' },
    { id: 2, customer: 'CV. XYZ Ltd', amount: '$8,750', status: 'In Progress', date: '2024-01-14' },
    { id: 3, customer: 'PT. DEF Inc', amount: '$15,200', status: 'Proposal Sent', date: '2024-01-13' },
    { id: 4, customer: 'UD. GHI Store', amount: '$5,600', status: 'Qualified', date: '2024-01-12' },
    { id: 5, customer: 'PT. JKL Group', amount: '$22,100', status: 'Closed Won', date: '2024-01-11' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'Closed Won': return '#059669'
      case 'In Progress': return '#2563eb'
      case 'Proposal Sent': return '#d97706'
      case 'Qualified': return '#7c3aed'
      default: return '#6b7280'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'Closed Won': return '#dcfce7'
      case 'In Progress': return '#dbeafe'
      case 'Proposal Sent': return '#fef3c7'
      case 'Qualified': return '#e9d5ff'
      default: return '#f3f4f6'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
          Sales Dashboard
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', margin: '0.25rem 0 0 0' }}>
          Track your sales performance and manage your pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        {salesStats.map((stat, index) => {
          const Icon = stat.icon
          const getIconBg = (color) => {
            if (color.includes('green')) return '#dcfce7'
            if (color.includes('blue')) return '#dbeafe'
            if (color.includes('purple')) return '#e9d5ff'
            if (color.includes('orange')) return '#fed7aa'
            return '#f3f4f6'
          }
          const getIconColor = (color) => {
            if (color.includes('green')) return '#059669'
            if (color.includes('blue')) return '#2563eb'
            if (color.includes('purple')) return '#7c3aed'
            if (color.includes('orange')) return '#ea580c'
            return '#6b7280'
          }
          
          return (
            <div key={index} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    color: '#6b7280',
                    margin: 0 
                  }}>
                    {stat.title}
                  </p>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#111827', 
                    marginTop: '0.5rem',
                    margin: '0.5rem 0 0 0'
                  }}>
                    {stat.value}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: stat.changeType === 'increase' ? '#059669' : '#dc2626'
                    }}>
                      {stat.change}
                    </span>
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: '#6b7280', 
                      marginLeft: '0.25rem' 
                    }}>
                      from last month
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: getIconBg(stat.color),
                  color: getIconColor(stat.color),
                  borderRadius: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem'
      }}>
        {/* Recent Deals */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
            }}>Recent Deals</h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem',
              margin: '0.25rem 0 0 0'
            }}>Latest sales opportunities and deals</p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentDeals.map((deal) => (
                <div key={deal.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#111827',
                      margin: 0
                    }}>{deal.customer}</p>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: 0
                    }}>{deal.date}</p>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem' 
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#111827'
                    }}>{deal.amount}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: getStatusColor(deal.status),
                      backgroundColor: getStatusBg(deal.status),
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem'
                    }}>
                      {deal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e2e8f0'
            }}>
              <button style={{
                fontSize: '0.875rem',
                color: '#2563eb',
                fontWeight: '500',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => e.target.style.color = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.color = '#2563eb'}
              >
                View all deals →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
            }}>Quick Actions</h2>
            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem',
              margin: '0.25rem 0 0 0'
            }}>Common sales tasks and shortcuts</p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Users size={20} style={{ color: '#2563eb', flexShrink: 0 }} />
                <div>
                  <p style={{
                    fontWeight: '500',
                    color: '#111827',
                    margin: 0
                  }}>Add New Lead</p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Create a new sales opportunity</p>
                </div>
              </button>
              
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <Calendar size={20} style={{ color: '#059669', flexShrink: 0 }} />
                <div>
                  <p style={{
                    fontWeight: '500',
                    color: '#111827',
                    margin: 0
                  }}>Schedule Meeting</p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Book a call with prospects</p>
                </div>
              </button>
              
              <button style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                textAlign: 'left',
                border: 'none',
                background: 'transparent',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <BarChart3 size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
                <div>
                  <p style={{
                    fontWeight: '500',
                    color: '#111827',
                    margin: 0
                  }}>View Reports</p>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Sales analytics and performance</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sales
