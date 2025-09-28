import React from 'react'

const Dashboard = () => {
  // Get username from localStorage or token
  const getUsername = () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.email?.split('@')[0] || 'admin123'
      } catch (error) {
        return 'admin123'
      }
    }
    return 'admin123'
  }

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center'
    }}>
      <div>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700', 
          color: '#111827', 
          margin: 0,
          marginBottom: '1rem'
        }}>
          Welcome {getUsername()}
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#6b7280', 
          margin: 0 
        }}>
          You are logged in as Administrator
        </p>
      </div>
    </div>
  )
}

export default Dashboard
