/**
 * Pagination Middleware
 * Handles pagination parameters from query string
 * Usage: router.get('/items', paginate, controller)
 */

const pagination = (req, res, next) => {
  try {
    // Get pagination parameters from query
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    
    // Get sorting parameters
    const sortBy = req.query.sortBy || 'id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    // Get search parameter (optional)
    const search = req.query.search || '';
    
    // Validate limit
    if (limit < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Limit must be at least 1' }
      });
    }
    
    // Attach to request
    req.pagination = {
      page,
      limit,
      offset,
      sortBy,
      sortOrder,
      search
    };
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid pagination parameters' }
    });
  }
};

/**
 * Helper function to format paginated response
 * @param {Array} data - Array of items
 * @param {Number} total - Total count of items
 * @param {Object} pagination - Pagination object
 * @returns {Object} Formatted response
 */
const formatPaginatedResponse = (data, total, pagination) => {
  const { limit, page, offset } = pagination;
  
  return {
    success: true,
    data,
    pagination: {
      total,
      count: data.length,
      perPage: limit,
      currentPage: page,
      lastPage: Math.ceil(total / limit),
      from: total === 0 ? 0 : offset + 1,
      to: Math.min(offset + limit, total),
      hasMore: offset + limit < total
    }
  };
};

module.exports = {
  pagination,
  formatPaginatedResponse
};
