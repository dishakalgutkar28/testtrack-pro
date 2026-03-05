# Phase 4: Frontend Enhancement & UX - Usage Guide

## Overview

Phase 4 has introduced several powerful frontend features to improve user experience and code quality:

1. **Toast Notification System** - User-friendly notifications
2. **Error Boundary** - Graceful error handling
3. **Loading States** - Better UX during async operations
4. **Skeleton Loaders** - Improved perceived performance
5. **Form Validation** - Real-time validation with user feedback
6. **Environment Configuration** - Proper config management

## 1. Toast Notifications

### Basic Usage

```javascript
import { useToast } from '../context/ToastContext';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  const handleWarning = () => {
    toast.warning('Please verify your email first.');
  };

  const handleInfo = () => {
    toast.info('New update available!');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      {/* ... */}
    </div>
  );
}
```

### Custom Duration

```javascript
// Show for 5 seconds instead of default 4 seconds
toast.success('Saved!', 5000);

// Show indefinitely (duration = 0)
toast.error('Critical error - requires action', 0);
```

### API Integration

Toast notifications are automatically shown for API errors via the axios interceptor in `services/api.js`.

## 2. Error Boundary

Already configured in App.js. Wrap any component that might throw errors:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

## 3. Loading States

### Using LoadingButton

```javascript
import LoadingButton from '../components/LoadingButton';
import { useState } from 'react';

function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.post('/endpoint', data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoadingButton
      loading={isLoading}
      onClick={handleSubmit}
      variant="primary" // primary, secondary, success, danger, outline
    >
      Submit
    </LoadingButton>
  );
}
```

### Using Loading Context

```javascript
import { useLoading } from '../context/LoadingContext';

function MyComponent() {
  const [isPageLoading, setPageLoading] = useLoading('myPage');

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        await api.get('/data');
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isPageLoading) {
    return <SkeletonTable rows={5} columns={4} />;
  }

  return <div>Content</div>;
}
```

## 4. Skeleton Loaders

### Basic Skeleton

```javascript
import { Skeleton, SkeletonText } from '../components/Skeleton';

<Skeleton width="200px" height="20px" />
<SkeletonText lines={3} />
```

### Skeleton Components

```javascript
import { 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar,
  SkeletonButton 
} from '../components/Skeleton';

function LoadingState() {
  return (
    <div>
      <SkeletonCard />
      <SkeletonTable rows={5} columns={4} />
      <SkeletonAvatar size="60px" variant="circle" />
      <SkeletonButton width="150px" />
    </div>
  );
}
```

### Full Page Example

```javascript
function ProjectsPage() {
  const [isLoading, setIsLoading] = useLoading('projects');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (isLoading) {
    return (
      <div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

## 5. Form Validation

### Complete Form Example

```javascript
import useFormValidation from '../hooks/useFormValidation';
import { loginSchema } from '../validators/schemas';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';
import { useToast } from '../context/ToastContext';

function LoginForm() {
  const toast = useToast();

  const handleLogin = async (values) => {
    try {
      const res = await api.post('/login', values);
      toast.success('Login successful!');
      // Handle success...
    } catch (error) {
      // Error toast is shown automatically by API interceptor
    }
  };

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation(
    { email: '', password: '' },
    handleLogin,
    loginSchema
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          className={`input-field ${errors.email && touched.email ? 'input-error' : ''}`}
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Email"
        />
        <FormError error={errors.email} touched={touched.email} />
      </div>

      <div className="form-group">
        <input
          className={`input-field ${errors.password && touched.password ? 'input-error' : ''}`}
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Password"
        />
        <FormError error={errors.password} touched={touched.password} />
      </div>

      <LoadingButton type="submit" loading={isSubmitting}>
        Login
      </LoadingButton>
    </form>
  );
}
```

### Available Validation Schemas

Located in `validators/schemas.js`:

- `loginSchema` - Email and password validation
- `registerSchema` - Registration with password confirmation
- `testCaseSchema` - Test case form validation
- `bugReportSchema` - Bug report validation
- `projectSchema` - Project creation validation
- `commentSchema` - Comment validation
- `forgotPasswordSchema` - Email validation
- `resetPasswordSchema` - Password reset with confirmation

### Custom Validation

```javascript
const customSchema = (values) => {
  const errors = {};
  
  if (!values.username) {
    errors.username = 'Username is required';
  } else if (values.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  }
  
  return errors;
};

// Use in form
const formValidation = useFormValidation(
  { username: '' },
  handleSubmit,
  customSchema
);
```

## 6. Environment Configuration

### Accessing Config

```javascript
import config from '../config';

// Use in components
console.log(config.API_URL);
console.log(config.ENV);
console.log(config.IS_PRODUCTION);

// Use in API calls (already configured in api.js)
```

### Environment Variables

Create `.env` file in frontend directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_LOG_LEVEL=debug
```

For production:

```env
REACT_APP_API_URL=https://api.yourproduction.com/api
REACT_APP_ENV=production
REACT_APP_LOG_LEVEL=error
```

## Complete Page Example

Here's a complete example showing all features together:

```javascript
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { useLoading } from '../context/LoadingContext';
import useFormValidation from '../hooks/useFormValidation';
import { testCaseSchema } from '../validators/schemas';
import LoadingButton from '../components/LoadingButton';
import FormError from '../components/FormError';
import { SkeletonTable } from '../components/Skeleton';
import api from '../services/api';

function TestCasePage() {
  const toast = useToast();
  const [testCases, setTestCases] = useState([]);
  const [isPageLoading, setPageLoading] = useLoading('testCases');

  // Fetch test cases
  useEffect(() => {
    const fetchTestCases = async () => {
      setPageLoading(true);
      try {
        const res = await api.get('/testcases');
        setTestCases(res.data);
      } catch (error) {
        // Error toast shown automatically
      } finally {
        setPageLoading(false);
      }
    };
    fetchTestCases();
  }, []);

  // Form submission
  const handleCreateTestCase = async (values) => {
    try {
      const res = await api.post('/testcases', values);
      setTestCases([...testCases, res.data]);
      toast.success('Test case created successfully!');
      resetForm();
    } catch (error) {
      // Error toast shown automatically
    }
  };

  // Form validation
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm
  } = useFormValidation(
    {
      title: '',
      description: '',
      priority: 'Medium',
      type: 'Functional'
    },
    handleCreateTestCase,
    testCaseSchema
  );

  // Show skeleton while loading
  if (isPageLoading) {
    return <SkeletonTable rows={5} columns={4} />;
  }

  return (
    <div>
      <h1>Test Cases</h1>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            className={`input-field ${errors.title && touched.title ? 'input-error' : ''}`}
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Test Case Title"
          />
          <FormError error={errors.title} touched={touched.title} />
        </div>

        <div className="form-group">
          <textarea
            className={`input-field ${errors.description && touched.description ? 'input-error' : ''}`}
            name="description"
            value={values.description}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Description"
          />
          <FormError error={errors.description} touched={touched.description} />
        </div>

        <LoadingButton type="submit" loading={isSubmitting}>
          Create Test Case
        </LoadingButton>
      </form>

      {/* Test Case List */}
      <div className="test-cases">
        {testCases.map(tc => (
          <div key={tc.id} className="test-case-card">
            <h3>{tc.title}</h3>
            <p>{tc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TestCasePage;
```

## Benefits Summary

✅ **Better UX** - Users get clear feedback on all actions
✅ **Reduced Errors** - Client-side validation catches issues early
✅ **Professional Experience** - Loading states and animations
✅ **Easier Maintenance** - Centralized error handling and validation
✅ **Type Safety** - Consistent patterns across the app
✅ **Mobile Friendly** - All components are responsive

## Next Steps

1. Update remaining pages to use the new patterns (Register, ForgotPassword, etc.)
2. Add loading states to all data fetching operations
3. Replace all `alert()` calls with toast notifications
4. Add skeleton loaders to all list/table views
5. Implement form validation on all forms

## API Error Handling

The API service now automatically:
- Shows error toasts for failed requests
- Handles 401 (Unauthorized) with token refresh
- Shows session expiration warnings
- Logs errors to console in development

No need to manually handle error toasts in most cases!
