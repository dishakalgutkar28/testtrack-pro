/**
 * Assignment Filtering Middleware
 * Filters database queries to show only assigned items for testers and developers
 * Admins and project managers see everything
 */

/**
 * Adds assignment filter WHERE clause and parameters
 * @param {Object} user - User object from JWT token
 * @param {string} table - Table name (testcases, bugs, execution_runs)
 * @returns {Object} { whereClause: string, params: array }
 */
exports.getAssignmentFilter = (user, table = 'testcases') => {
  // Admins see everything
  if (user.role === 'admin') {
    return { whereClause: '', params: [] };
  }

  // Testers and developers see only assigned items
  if (user.role === 'tester' || user.role === 'developer') {
    return {
      whereClause: `${table}.assigned_to = ?`,
      params: [user.id]
    };
  }

  // Default: no filter (for other roles)
  return { whereClause: '', params: [] };
};

/**
 * Middleware factory to enforce assignment filtering on GET requests
 * Usage: router.get('/endpoint', authMiddleware, enforceAssignmentFilter('testcases'), handler)
 * @param {string} table - Table name to filter
 * @param {string} idColumn - Column name for ID (default: 'id')
 */
exports.enforceAssignmentFilter = (table = 'testcases', idColumn = 'id') => {
  return (req, res, next) => {
    // Add filter function to request object for use in route handlers
    req.assignmentFilter = {
      table,
      idColumn,
      getWhereClause: () => {
        return exports.getAssignmentFilter(req.user, table);
      }
    };
    next();
  };
};

/**
 * Check if user has access to a specific resource
 * @param {Object} user - User object from JWT token
 * @param {number} assignedToUserId - User ID that the resource is assigned to
 * @returns {boolean} true if user can access
 */
exports.canAccessResource = (user, assignedToUserId) => {
  // Admins can access everything
  if (user.role === 'admin') {
    return true;
  }

  // Testers and developers can only access their assigned items
  if (user.role === 'tester' || user.role === 'developer') {
    return user.id === assignedToUserId;
  }

  return false;
};

/**
 * Check if user can modify a resource
 * Creator and assigned user can modify; admin can always modify
 * @param {Object} user - User object from JWT token
 * @param {number} createdByUserId - User ID that created the resource
 * @param {number} assignedToUserId - User ID that the resource is assigned to
 * @returns {boolean} true if user can modify
 */
exports.canModifyResource = (user, createdByUserId, assignedToUserId) => {
  // Admins can modify everything
  if (user.role === 'admin') {
    return true;
  }

  // Creator can modify their own items
  if (user.id === createdByUserId) {
    return true;
  }

  // Assigned user can modify
  if (user.role === 'tester' || user.role === 'developer') {
    return user.id === assignedToUserId;
  }

  return false;
};
