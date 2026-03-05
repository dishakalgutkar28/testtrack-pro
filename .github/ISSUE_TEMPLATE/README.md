# TestTrack Pro

**A comprehensive software testing platform for managing test cases, executions, and bug tracking.**

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Deployment](#deployment)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## 🎯 About

TestTrack Pro is a full-stack test management platform designed to streamline the software testing lifecycle. It bridges the gap between QA testers and developers by providing:

- **For Testers:** Create detailed test cases, execute tests step-by-step, and track results
- **For Developers:** View assigned bugs, update fix status, link commits, and collaborate
- **For Teams:** Comprehensive reporting, analytics, and project management

---

## ✨ Features

### Core Features
- ✅ **User Authentication** - JWT-based auth with email verification and password reset
- ✅ **Test Case Management** - Create, edit, clone, delete test cases with rich metadata
- ✅ **Test Execution** - Step-by-step execution with evidence capture and timing
- ✅ **Bug Management** - Complete bug lifecycle from creation to resolution
- ✅ **Project Management** - Multi-project support with project-specific data
- ✅ **Reporting & Analytics** - Execution reports, bug analytics, and dashboards
- ✅ **Role-Based Access** - Tester, Developer, and Admin roles with permissions

### Advanced Features
- ✅ **Lifecycle State Management** - Enforce test case state transitions
- ✅ **Reopen Logic** - Track test case reopens with audit trail
- ✅ **Commit Linking** - Link Git commits to bug fixes
- ✅ **Execution Comparison** - Compare current vs previous test runs
- ✅ **CSV Import/Export** - Bulk import and export test cases
- ✅ **Bulk Operations** - Update multiple test cases simultaneously
- ✅ **Version History** - Track all changes to test cases
- ✅ **Enhanced Comments** - Rich collaboration with @mentions

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 19.2.4
- React Router v7
- Bootstrap 5.3
- Chart.js for analytics
- Axios for API calls

**Backend:**
- Node.js with Express.js
- MySQL 8.0 database
- JWT authentication with refresh tokens
- bcrypt for password hashing
- Nodemailer for email service

**DevOps:**
- Docker & Docker Compose
- MySQL containerization
- Multi-stage builds for optimization

### Project Structure

```
testtrack-pro/
├── backend/               # Node.js/Express API
│   ├── config/           # Database, env config
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic layer
│   ├── repositories/     # Database abstraction
│   ├── utils/            # Helpers, logger, sanitization
│   ├── migrations/       # Database migrations
│   └── tests/            # Unit and integration tests
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API service layer
│   │   ├── validators/   # Form validation schemas
│   │   └── config/       # Frontend configuration
│   └── public/           # Static assets
├── docker-compose.yml    # Docker orchestration
├── deploy.sh             # Linux deployment script
├── deploy.bat            # Windows deployment script
└── README.md             # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8.0+ ([Download](https://dev.mysql.com/downloads/))
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for containerized deployment)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/testtrack-pro.git
   cd testtrack-pro
   ```

2. **Run setup script**
   ```bash
   # Linux/Mac
   chmod +x setup.sh
   ./setup.sh
   
   # Windows
   setup.bat
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

---

## 💻 Installation

### Option 1: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

5. **Setup database**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE testtrack;
   exit;
   
   # Run migrations
   mysql -u root -p testtrack < migrations/001_add_indexes.sql
   ```

6. **Start backend server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment** (edit `.env`)
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Start development server**
   ```bash
   npm start
   ```

### Option 2: Docker Setup

1. **Create .env file in root**
   ```bash
   cp .env.example .env
   ```

2. **Edit configuration** (update MySQL and JWT secrets)

3. **Build and start containers**
   ```bash
   # Linux/Mac
   ./deploy.sh
   
   # Windows
   deploy.bat
   
   # Or using docker-compose directly
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop containers**
   ```bash
   docker-compose down
   ```

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=testtrack
DB_POOL_LIMIT=10
DB_CONNECTION_TIMEOUT=10000

# JWT Configuration (REQUIRED)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_EXPIRY=24h
REFRESH_EXPIRY=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Email Configuration (for production)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Logging
LOG_LEVEL=info
```

**⚠️ IMPORTANT:** 
- Never commit `.env` files to version control
- Use strong, unique secrets for JWT keys (min 32 characters)
- Change default passwords in production

### Frontend Environment Variables

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Database Setup

**Option 1: Automatic (via Docker)**
```bash
docker-compose up database -d
```

**Option 2: Manual MySQL Setup**
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE testtrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional)
CREATE USER 'testtrack_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON testtrack.* TO 'testtrack_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
exit;

# Run migrations
cd backend
mysql -u root -p testtrack < migrations/001_add_indexes.sql
```

---

## 📖 Usage

### Default Users

After setup, create your first user:

1. Navigate to http://localhost:3000
2. Click **Register**
3. Fill in email and password
4. Check console logs for email verification link (dev mode)
5. Click verification link
6. Login with your credentials

### User Roles

- **Tester** - Create and execute test cases, report bugs
- **Developer** - View assigned bugs, update status, add fix notes
- **Admin** - Manage users, projects, and system configuration

### Creating Your First Test Case

1. Login as tester
2. Navigate to **Test Cases**
3. Click **Create Test Case**
4. Fill in required fields:
   - Title
   - Description
   - Priority (Low/Medium/High)
   - Type (Functional/Regression/etc.)
5. Add test steps:
   - Action
   - Expected Result
   - Test Data (optional)
6. Click **Save**

### Executing Tests

1. Open a test case
2. Click **Execute**
3. For each step:
   - Mark as Pass/Fail/Blocked/Skipped
   - Add actual results
   - Upload screenshots (optional)
4. Complete execution
5. View execution history

### Reporting Bugs

1. From failed test execution, click **Create Bug**
2. Or navigate to **Bugs** → **Report Bug**
3. Fill in bug details:
   - Title and description
   - Steps to reproduce
   - Expected vs Actual behavior
   - Priority and Severity
4. Assign to developer
5. Upload evidence
6. Submit

---

## 🌐 Deployment

### Production Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Configure production database
- [ ] Setup SMTP for email service
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for production domain
- [ ] Setup database backups
- [ ] Configure logging and monitoring
- [ ] Run security audit: `npm audit`
- [ ] Optimize images and assets
- [ ] Setup rate limiting

### Docker Production Deployment

1. **Update docker-compose.yml for production**
   ```yaml
   environment:
     NODE_ENV: production
     JWT_SECRET: ${JWT_SECRET}
     # ... other production variables
   ```

2. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

3. **Setup reverse proxy (Nginx)**
   ```nginx
   server {
     listen 80;
     server_name yourdomain.com;
     
     location /api {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
     
     location / {
       proxy_pass http://localhost:3000;
     }
   }
   ```

### Free Hosting Options

**Frontend:**
- [Vercel](https://vercel.com) - Free tier, automatic deployments
- [Netlify](https://netlify.com) - Free tier, continuous deployment
- [GitHub Pages](https://pages.github.com) - Free static hosting

**Backend:**
- [Railway](https://railway.app) - $5 credit/month
- [Render](https://render.com) - Free tier available
- [Fly.io](https://fly.io) - Free allowance

**Database:**
- [Neon](https://neon.tech) - Free PostgreSQL (would need migration)
- [PlanetScale](https://planetscale.com) - Free MySQL tier
- [Supabase](https://supabase.com) - Free PostgreSQL

---

## 🧪 Testing

### Running Tests

**Backend Unit Tests:**
```bash
cd backend
npm test                    # Run all tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

**Frontend Tests:**
```bash
cd frontend
npm test                    # Run all tests
npm test -- --coverage      # With coverage
```

### Test Coverage Goals

- Unit test coverage: **≥ 70%**
- Integration tests for all API endpoints
- E2E tests for critical user flows

### Writing Tests

**Backend Test Example:**
```javascript
describe('AuthService', () => {
  it('should hash password correctly', async () => {
    const password = 'Test@123';
    const hashed = await authService.hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$/);
  });
});
```

---

## 📚 API Documentation

### Accessing API Docs

Once the backend is running, access Swagger documentation at:
- **Local:** http://localhost:5000/api-docs
- **Production:** https://yourdomain.com/api-docs

### Key Endpoints

#### Authentication
```
POST   /api/register              Register new user
POST   /api/login                 Login user
POST   /api/forgot-password       Request password reset
POST   /api/reset-password        Reset password with token
GET    /api/verify-email/:token   Verify email address
POST   /api/refresh-token         Refresh access token
POST   /api/logout                Logout user
```

#### Test Cases
```
GET    /api/testcase              Get all test cases
POST   /api/testcase              Create test case
GET    /api/testcase/:id          Get test case by ID
PUT    /api/testcase/:id          Update test case
DELETE /api/testcase/:id          Delete test case
POST   /api/testcase/:id/clone    Clone test case
PUT    /api/testcase/bulk-update  Bulk update test cases
```

#### Bugs
```
GET    /api/bugs                  Get all bugs
POST   /api/bugs                  Create bug
PUT    /api/bugs/:id              Update bug
GET    /api/developer-bugs        Get bugs for logged-in developer
PUT    /api/bugs/:id/status       Update bug status
```

#### Projects
```
GET    /api/projects              Get all projects
POST   /api/projects              Create project
PUT    /api/projects/:id          Update project
DELETE /api/projects/:id          Delete project
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m "feat(module): add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes
   - `refactor:` Code refactoring
   - `test:` Adding tests
   - `chore:` Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### Code Style

- Use ESLint for JavaScript linting
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions small and focused
- Write meaningful commit messages

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **Your Name** - Initial work

---

## 🙏 Acknowledgments

- Express.js for the backend framework
- React team for the frontend library
- Bootstrap for UI components
- Chart.js for analytics visualization
- All contributors who help improve this project

---

## 📞 Support

For issues, questions, or suggestions:

- **Issues:** [GitHub Issues](https://github.com/yourusername/testtrack-pro/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/testtrack-pro/discussions)
- **Email:** support@testtrackpro.com

---

## 🗺️ Roadmap

### Upcoming Features
- [ ] Test Suite Management
- [ ] In-app notifications
- [ ] PDF/Excel report export
- [ ] Webhook support
- [ ] Project milestones
- [ ] Advanced search and filters
- [ ] OAuth integration (Google, GitHub)
- [ ] Mobile application
- [ ] API rate limiting
- [ ] CSRF protection
- [ ] CI/CD pipeline

### Phase Completion
- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Core Test Case Features
- ✅ Phase 3: Execution & Bug Management
- ✅ Phase 4: Frontend Enhancement & UX
- 🚧 Phase 5: Reporting & Advanced Features

---

**Made with ❤️ by the TestTrack Pro Team**
