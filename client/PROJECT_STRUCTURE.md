# FlowForce HRM Platform - Project Structure

## Overview
FlowForce is a modern HR Management (HRM) platform built with Next.js 16, React, TypeScript, Zustand, and shadcn/ui components. The application features both public-facing pages and authenticated user dashboards with comprehensive employee management, timesheet tracking, and leave management systems.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 16 (App Router)
- **UI Framework**: React 19
- **State Management**: Zustand (cookie-based persistence)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Type Safety**: TypeScript
- **Storage**: Cookie-only (no localStorage)

### Key Design Principles
1. **Component Reusability**: Highly modularized components separated into smart (container) and dumb (presentation) components
2. **State Management**: Centralized Zustand stores with cookie persistence for secure, browser-compatible storage
3. **Security**: Cookie-based authentication with httpOnly support, no sensitive data in localStorage
4. **Separation of Concerns**: Public pages in `app/(public)` route group, authenticated pages in `app/` root

## Project Structure

```
app/
├── (public)/                    # Public-facing pages (route group)
│   ├── page.tsx                # Landing page
│   ├── about/page.tsx          # About page
│   ├── features/page.tsx       # Features showcase
│   ├── pricing/page.tsx        # Pricing plans
│   ├── blog/page.tsx           # Blog listing
│   ├── contact/page.tsx        # Contact form
│   ├── privacy/page.tsx        # Privacy policy
│   ├── terms/page.tsx          # Terms of service
│   ├── cookies/page.tsx        # Cookie policy
│   └── security/page.tsx       # Security & compliance
├── login/page.tsx              # Login page
├── register/page.tsx           # Registration page
├── dashboard/page.tsx          # Main dashboard
├── employees/page.tsx          # Employee management
├── timesheet/page.tsx          # Timesheet tracking
├── leave/page.tsx              # Leave management
├── page.tsx                    # Root redirect (auth-based)
└── layout.tsx                  # Root layout

components/
├── auth/
│   ├── LoginForm.tsx           # Login form component
│   └── RegisterForm.tsx        # Registration form component
├── layout/
│   ├── PublicLayout.tsx        # Public pages layout (nav + footer)
│   ├── MainLayout.tsx          # Authenticated pages layout
│   ├── Sidebar.tsx             # Navigation sidebar
│   └── Header.tsx              # Top navigation header
├── dashboard/
│   ├── StatCard.tsx            # Statistics card component
│   └── RecentActivity.tsx      # Activity feed component
├── employees/
│   ├── EmployeeTable.tsx       # Employee listing table
│   └── EmployeeForm.tsx        # Add/edit employee form
├── timesheet/
│   ├── TimesheetTable.tsx      # Timesheet listing
│   └── TimesheetForm.tsx       # Timesheet entry form
├── leave/
│   ├── LeaveTable.tsx          # Leave request listing
│   └── LeaveForm.tsx           # Leave request form
├── ProtectedRoute.tsx          # Auth wrapper component
└── ui/                         # shadcn/ui components (auto-generated)

lib/
├── types.ts                    # TypeScript type definitions
├── cookies.ts                  # Cookie utilities & helpers
├── api.ts                      # API client with auth injection
└── stores/
    ├── authStore.ts            # Authentication Zustand store
    └── appStore.ts             # Application state Zustand store

hooks/
├── useAuth.ts                  # Auth state hook
└── useApp.ts                   # App state hook

public/
└── [static assets]

styles/
└── globals.css                 # Global Tailwind styles
```

## Core Systems

### 1. Authentication System
**Files**: `lib/stores/authStore.ts`, `hooks/useAuth.ts`, `components/auth/`

- **Storage**: Cookie-based with 7-day expiration
- **Auth Token**: Stored in httpOnly-compatible cookie
- **Session Management**: Automatic initialization on app load
- **Protected Routes**: `ProtectedRoute.tsx` wrapper for dashboard pages
- **Redirect Logic**: Unauthenticated users redirected to login

### 2. State Management (Zustand + Cookies)
**Files**: `lib/stores/`, `lib/cookies.ts`, `hooks/`

**Auth Store** (`authStore.ts`):
- User data (id, name, email, role, department)
- Authentication token
- Login/logout methods
- User update methods

**App Store** (`appStore.ts`):
- Sidebar toggle state
- Theme preferences
- Notification settings
- UI state management

**Cookie Utilities** (`cookies.ts`):
- `getCookie()`, `setCookie()`, `removeCookie()`
- Serialization/deserialization helpers
- 7-day expiration default
- Path and domain configuration

### 3. API Integration
**Files**: `lib/api.ts`

- Centralized fetch wrapper
- Automatic auth token injection in headers
- Error handling and response parsing
- Base URL configuration
- Request/response interceptors

### 4. Public Pages System
**Route Group**: `app/(public)/`

Landing page with:
- Hero section with CTAs
- Features showcase (6 feature cards)
- Statistics section
- Testimonials placeholder
- Call-to-action buttons

Additional pages:
- **About**: Company mission, values, team info
- **Features**: Detailed feature breakdown
- **Pricing**: 3-tier pricing plan (Starter, Professional, Enterprise)
- **Blog**: Blog post listing with search/filter
- **Contact**: Contact form + FAQ
- **Privacy**: Full privacy policy
- **Terms**: Terms of service
- **Cookies**: Cookie policy
- **Security**: Security certifications & practices

### 5. Authenticated Pages

**Dashboard** (`/dashboard`):
- Statistics cards (employees, timesheets, pending requests)
- Recent activity feed
- Quick action buttons
- Welcome message

**Employees** (`/employees`):
- Employee listing table with search
- Add/edit employee form
- Department & position selection
- Employee details modal

**Timesheet** (`/timesheet`):
- Timesheet entry table
- Auto-calculated hours & overtime
- Status filtering (pending/approved/rejected)
- Approval workflow
- Date range filtering

**Leave** (`/leave`):
- Leave request listing
- Multiple leave types (Annual, Sick, Personal)
- Leave balance tracking
- Request status workflow
- Date range & status filtering

## Component Patterns

### Smart Components (Containers)
Handle data fetching, state management, and business logic:
- `EmployeeTable.tsx` - manages employee list state
- `TimesheetTable.tsx` - handles timesheet filtering & actions
- `LeaveForm.tsx` - manages form state & submissions

### Dumb Components (Presentational)
Pure UI components that receive props:
- `StatCard.tsx` - displays statistics
- `RecentActivity.tsx` - displays activity items
- Form inputs from shadcn/ui

### Layout Components
Wrapper components for page structure:
- `PublicLayout.tsx` - navigation + footer for public pages
- `MainLayout.tsx` - sidebar + header for authenticated pages
- `ProtectedRoute.tsx` - authentication check wrapper

## Styling

**Design System**: Custom Tailwind CSS v4 with semantic design tokens

Key Colors:
- Primary: Brand color (blue)
- Muted: Neutral grays
- Background/Foreground: Light/dark mode support
- Border: Subtle dividers

**Typography**:
- Headings: Geist font (sans-serif)
- Body: Geist font (sans-serif)
- Mono: Geist Mono for code

**Responsive**:
- Mobile-first approach
- Breakpoints: `sm`, `md`, `lg`
- Flexible grid layouts

## Data Flow

### User Authentication Flow
1. User enters credentials in `LoginForm.tsx`
2. Submit to `/api/login` endpoint
3. Receive auth token in response
4. `authStore.login()` saves token to cookie (7-day expiry)
5. `useAuth()` hook updates state
6. User redirected to `/dashboard`
7. Protected routes check `isAuthenticated` before rendering

### State Synchronization Flow
1. App initializes, `useAuth.ts` checks cookies on mount
2. Token found → `authStore.hydrate()` restores state
3. Token expired/missing → user sent to `/login`
4. All API calls inject token via `lib/api.ts` wrapper
5. Logout clears cookie and resets stores

## API Integration Points

### Endpoints Used (Backend should implement)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee
- `GET /api/timesheets` - List timesheets
- `POST /api/timesheets` - Create timesheet
- `PUT /api/timesheets/{id}` - Update timesheet
- `GET /api/leave` - List leave requests
- `POST /api/leave` - Create leave request
- `PUT /api/leave/{id}` - Update leave request status

## Key Features Implemented

### ✅ Completed
- [x] Zustand state management with cookie persistence
- [x] Protected route authentication
- [x] Employee management (CRUD)
- [x] Timesheet tracking with auto-calculation
- [x] Leave management system
- [x] Dashboard with statistics
- [x] Public landing page
- [x] Public company pages (about, pricing, features)
- [x] Legal pages (privacy, terms, cookies)
- [x] Contact & blog pages
- [x] Responsive design
- [x] Reusable component architecture

### 📋 Ready for Backend Integration
- Database models for users, employees, timesheets, leave
- API routes and endpoints
- Authentication middleware
- Database migrations
- Email notifications
- Advanced reporting

## Environment Variables
No API keys required for client-side code. Backend should be configured with:
- Database connection strings
- JWT secrets
- Email service credentials
- Session storage settings

## Development Guidelines

### Adding New Pages
1. Create folder in `app/` or `app/(public)/`
2. Add `page.tsx` file
3. Wrap with layout component (`PublicLayout` or `MainLayout`)
4. Use Zustand hooks for state

### Adding New Components
1. Create in `components/` with appropriate subfolder
2. Keep presentation logic separate from state
3. Export both smart and dumb variants if needed
4. Use TypeScript interfaces for props

### State Management
1. Define state in Zustand store
2. Create custom hook in `hooks/` to expose store
3. Use hook in components via `const { state, action } = useStore()`
4. Store automatically persists to cookies

### Styling
1. Use Tailwind classes (no inline styles)
2. Reference semantic design tokens (colors, spacing)
3. Follow mobile-first responsive approach
4. Use shadcn/ui components when possible

## Security Considerations

1. **Authentication**
   - Cookies set with httpOnly flag (backend responsibility)
   - 7-day expiration
   - Token validation on API calls

2. **Data Privacy**
   - No sensitive data in localStorage
   - All state persisted via cookies
   - API client handles token injection

3. **XSS Protection**
   - React's built-in XSS escaping
   - No innerHTML usage
   - Content Security Policy (via backend)

4. **CSRF Protection**
   - Implement CSRF tokens in API (backend)
   - SameSite cookie attribute (backend)

## Performance Optimizations

1. **Code Splitting**: Next.js automatic route-based splitting
2. **Image Optimization**: Placeholder system in cards
3. **State Management**: Zustand for minimal re-renders
4. **Caching**: Browser cache for static assets

## Deployment

### Vercel Deployment (Recommended)
```bash
npm run build
npm start
```

### Environment Setup
- No special environment variables required for frontend
- Backend API URL can be set via `process.env.NEXT_PUBLIC_API_URL`

## Future Enhancements

1. Dark mode toggle via app store
2. Multi-language support (i18n)
3. Advanced reporting & exports
4. Mobile app version
5. Real-time notifications
6. Team collaboration features
7. Custom workflows
8. Third-party integrations (Slack, Teams, Google)

## Support & Maintenance

- Regular dependency updates
- Security patches
- Performance monitoring
- User feedback integration

---

**Last Updated**: April 2024
**Version**: 1.0.0
