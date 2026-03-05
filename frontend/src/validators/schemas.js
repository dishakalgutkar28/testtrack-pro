// Validation Schemas for Forms

export const loginSchema = (values) => {
  const errors = {};
  
  // Email validation
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  
  // Password validation
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return errors;
};

export const registerSchema = (values) => {
  const errors = {};
  
  // Name validation
  if (!values.name) {
    errors.name = 'Name is required';
  } else if (values.name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (values.name.length > 50) {
    errors.name = 'Name must be less than 50 characters';
  }
  
  // Email validation
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  
  // Password validation
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  } else if (values.password.length > 100) {
    errors.password = 'Password is too long';
  }
  
  // Confirm password validation
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  // Role validation
  if (!values.role) {
    errors.role = 'Role is required';
  }
  
  return errors;
};

export const testCaseSchema = (values) => {
  const errors = {};
  
  if (!values.title) {
    errors.title = 'Title is required';
  } else if (values.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (values.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  if (!values.description) {
    errors.description = 'Description is required';
  } else if (values.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  if (!values.priority) {
    errors.priority = 'Priority is required';
  }
  
  if (!values.type) {
    errors.type = 'Type is required';
  }
  
  return errors;
};

export const bugReportSchema = (values) => {
  const errors = {};
  
  if (!values.title) {
    errors.title = 'Title is required';
  } else if (values.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
  } else if (values.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  if (!values.description) {
    errors.description = 'Description is required';
  } else if (values.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  if (!values.severity) {
    errors.severity = 'Severity is required';
  }
  
  if (!values.priority) {
    errors.priority = 'Priority is required';
  }
  
  if (!values.status) {
    errors.status = 'Status is required';
  }
  
  return errors;
};

export const projectSchema = (values) => {
  const errors = {};
  
  if (!values.name) {
    errors.name = 'Project name is required';
  } else if (values.name.length < 3) {
    errors.name = 'Project name must be at least 3 characters';
  } else if (values.name.length > 100) {
    errors.name = 'Project name must be less than 100 characters';
  }
  
  if (values.description && values.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  return errors;
};

export const commentSchema = (values) => {
  const errors = {};
  
  if (!values.comment) {
    errors.comment = 'Comment cannot be empty';
  } else if (values.comment.length < 3) {
    errors.comment = 'Comment must be at least 3 characters';
  } else if (values.comment.length > 1000) {
    errors.comment = 'Comment must be less than 1000 characters';
  }
  
  return errors;
};

export const forgotPasswordSchema = (values) => {
  const errors = {};
  
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  
  return errors;
};

export const resetPasswordSchema = (values) => {
  const errors = {};
  
  if (!values.password) {
    errors.password = 'Password is required';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  
  return errors;
};

// Generic field validators
export const validators = {
  required: (value) => {
    return value ? '' : 'This field is required';
  },
  
  email: (value) => {
    if (!value) return '';
    return /\S+@\S+\.\S+/.test(value) ? '' : 'Email is invalid';
  },
  
  minLength: (min) => (value) => {
    if (!value) return '';
    return value.length >= min ? '' : `Must be at least ${min} characters`;
  },
  
  maxLength: (max) => (value) => {
    if (!value) return '';
    return value.length <= max ? '' : `Must be less than ${max} characters`;
  },
  
  match: (fieldName) => (value, allValues) => {
    return value === allValues[fieldName] ? '' : `Must match ${fieldName}`;
  }
};

const schemas = {
  loginSchema,
  registerSchema,
  testCaseSchema,
  bugReportSchema,
  projectSchema,
  commentSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validators
};

export default schemas;
