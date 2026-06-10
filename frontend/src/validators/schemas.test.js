/**
 * Validation Schemas Unit Tests
 * Tests for form validation logic
 */

import {
  loginSchema,
  registerSchema,
  testCaseSchema,
  bugReportSchema,
  projectSchema,
  commentSchema,
  resetPasswordSchema
} from '../validators/schemas';

describe('Validation Schemas', () => {
  describe('Login Schema', () => {
    it('should validate correct credentials', () => {
      const values = {
        email: 'user@example.com',
        password: 'password123'
      };
      
      const errors = loginSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require email', () => {
      const values = { email: '', password: 'password123' };
      const errors = loginSchema(values);
      expect(errors.email).toBeTruthy();
    });

    it('should validate email format', () => {
      const values = {
        email: 'invalid-email',
        password: 'password123'
      };
      
      const errors = loginSchema(values);
      expect(errors.email).toBeTruthy();
    });

    it('should require password minimum length', () => {
      const values = {
        email: 'user@example.com',
        password: '123'
      };
      
      const errors = loginSchema(values);
      expect(errors.password).toBeTruthy();
    });
  });

  describe('Register Schema', () => {
    it('should validate complete registration', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'tester'
      };
      
      const errors = registerSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require name', () => {
      const values = {
        name: '',
        email: 'john@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'tester'
      };
      
      const errors = registerSchema(values);
      expect(errors.name).toBeTruthy();
    });

    it('should validate password confirmation match', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass',
        role: 'tester'
      };
      
      const errors = registerSchema(values);
      expect(errors.confirmPassword).toBeTruthy();
    });

    it('should require valid role', () => {
      const values = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: ''
      };
      
      const errors = registerSchema(values);
      expect(errors.role).toBeTruthy();
    });
  });

  describe('Test Case Schema', () => {
    it('should validate complete test case', () => {
      const values = {
        title: 'Valid Test Case Title',
        description: 'This is a detailed test case description',
        priority: 'High',
        type: 'Functional'
      };
      
      const errors = testCaseSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require minimum title length', () => {
      const values = {
        title: 'Bad',
        description: 'This is a detailed test case description',
        priority: 'High',
        type: 'Functional'
      };
      
      const errors = testCaseSchema(values);
      expect(errors.title).toBeTruthy();
    });

    it('should require minimum description length', () => {
      const values = {
        title: 'Valid Title',
        description: 'Short',
        priority: 'High',
        type: 'Functional'
      };
      
      const errors = testCaseSchema(values);
      expect(errors.description).toBeTruthy();
    });
  });

  describe('Comment Schema', () => {
    it('should validate comment', () => {
      const values = { comment: 'This is a valid comment' };
      const errors = commentSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require minimum comment length', () => {
      const values = { comment: 'ab' };
      const errors = commentSchema(values);
      expect(errors.comment).toBeTruthy();
    });

    it('should enforce maximum comment length', () => {
      const values = { comment: 'a'.repeat(1001) };
      const errors = commentSchema(values);
      expect(errors.comment).toBeTruthy();
    });
  });

  describe('Bug Report Schema', () => {
    it('should validate complete bug report', () => {
      const values = {
        title: 'Critical Bug Found',
        description: 'This is a detailed bug description with steps to reproduce',
        severity: 'Critical',
        priority: 'High',
        status: 'Open'
      };
      
      const errors = bugReportSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require all fields', () => {
      const values = {
        title: 'Bug',
        description: '',
        severity: '',
        priority: '',
        status: ''
      };
      
      const errors = bugReportSchema(values);
      expect(Object.keys(errors).length > 0).toBe(true);
    });
  });

  describe('Project Schema', () => {
    it('should validate project creation', () => {
      const values = {
        name: 'E-Commerce Project',
        description: 'Main e-commerce platform'
      };
      
      const errors = projectSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should require minimum project name length', () => {
      const values = {
        name: 'AB',
        description: 'Project description'
      };
      
      const errors = projectSchema(values);
      expect(errors.name).toBeTruthy();
    });
  });

  describe('Password Reset Schema', () => {
    it('should validate password reset', () => {
      const values = {
        password: 'NewSecurePassword123',
        confirmPassword: 'NewSecurePassword123'
      };
      
      const errors = resetPasswordSchema(values);
      expect(Object.keys(errors).length).toBe(0);
    });

    it('should validate password confirmation match', () => {
      const values = {
        password: 'NewSecurePassword123',
        confirmPassword: 'DifferentPassword'
      };
      
      const errors = resetPasswordSchema(values);
      expect(errors.confirmPassword).toBeTruthy();
    });
  });
});
