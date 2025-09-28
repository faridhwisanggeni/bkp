const errorHandler = (err, req, res, next) => {
  console.error('Error:', err)

  // Default error
  let error = {
    success: false,
    message: 'Internal server error'
  }

  // Validation error
  if (err.name === 'ValidationError') {
    error.message = 'Validation error'
    error.details = Object.values(err.errors).map(val => val.message)
    return res.status(400).json(error)
  }

  // Database error
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.message = 'Duplicate entry'
        return res.status(409).json(error)
      case '23503': // Foreign key violation
        error.message = 'Referenced record not found'
        return res.status(400).json(error)
      case '23502': // Not null violation
        error.message = 'Required field missing'
        return res.status(400).json(error)
      default:
        error.message = 'Database error'
        return res.status(500).json(error)
    }
  }

  // Default 500 error
  if (process.env.NODE_ENV === 'development') {
    error.error = err.message
    error.stack = err.stack
  }

  res.status(500).json(error)
}

module.exports = errorHandler
