# UI/UX Design Specifications - Cycle 10

## Overview
Design specifications for authentication pages to resolve GitHub Issue #6 (404 error on /login redirect).

## User Journeys

### 1. New User Registration
**Entry Points:**
- Landing page "Get Started" CTA
- Dashboard redirect when unauthenticated
- Direct URL access to /signup

**Flow:**
1. User lands on /signup
2. Enters email and password
3. Accepts terms of service
4. Submits form → Supabase auth
5. Email verification sent
6. Redirected to /dashboard with onboarding

### 2. Existing User Login
**Entry Points:**
- Dashboard authentication check
- Landing page "Sign In" link
- Direct URL access to /login

**Flow:**
1. User lands on /login
2. Enters email/password
3. Optional "Remember me" selection
4. Submits → Supabase auth
5. Success → /dashboard
6. Failure → inline error message

### 3. Password Recovery
**Flow:**
1. Click "Forgot password?" on /login
2. Enter email on /forgot-password
3. Submit → Supabase sends reset email
4. User clicks email link
5. Lands on /reset-password with token
6. Sets new password → auto-login

## Page Designs

### Login Page (/login)

**Layout:**
- Split-screen design: left branding, right form
- Mobile: stacked vertically

**Components:**
```
┌─────────────────────────────────────┐
│         JARVIS AI CHATBOT           │
│      [Logo/Illustration]            │
│   "Intelligent conversations for    │
│       your website visitors"        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           Welcome Back              │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │ user@example.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  □ Remember me    Forgot password? │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Sign In               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────── OR CONTINUE WITH ──────   │
│                                     │
│  [Google] [GitHub] [Microsoft]     │
│                                     │
│  Don't have an account? Sign up    │
└─────────────────────────────────────┘
```

**Styles:**
- Primary button: bg-blue-600 hover:bg-blue-700
- Input fields: border-gray-300 focus:ring-blue-500
- Error states: border-red-500 text-red-600
- Social buttons: respective brand colors

### Signup Page (/signup)

**Layout:**
Similar split-screen with extended form

**Components:**
```
┌─────────────────────────────────────┐
│        Create Your Account          │
│                                     │
│  Full Name                          │
│  ┌─────────────────────────────┐   │
│  │ John Doe                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │ user@example.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password                           │
│  ┌─────────────────────────────┐   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│  Password strength: [████░░░░]     │
│                                     │
│  Confirm Password                   │
│  ┌─────────────────────────────┐   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  □ I agree to Terms and Privacy    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Create Account          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Already have an account? Sign in  │
└─────────────────────────────────────┘
```

**Password Requirements:**
- Minimum 8 characters
- One uppercase letter
- One number
- Real-time validation feedback

### Forgot Password Page (/forgot-password)

**Layout:**
Centered card design

**Components:**
```
┌─────────────────────────────────────┐
│        Reset Your Password          │
│                                     │
│  Enter your email and we'll send   │
│  you instructions to reset your    │
│  password.                          │
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │ user@example.com            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    Send Reset Link          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Back to Sign in                   │
└─────────────────────────────────────┘
```

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Single column layout
- Full-width form inputs
- Larger touch targets (min 44px)
- Hide decorative illustrations
- Bottom-sheet modals for errors

### Tablet Adaptations
- Centered form with padding
- Maintain split-screen on landscape
- Adjust font sizes

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- Tab order: logical top-to-bottom
- Focus indicators: 2px blue outline
- Skip links for screen readers
- Escape key closes modals

### Screen Readers
- Semantic HTML structure
- ARIA labels for icons
- Form validation announcements
- Loading state announcements

### Visual Accessibility
- Color contrast: 4.5:1 minimum
- Text scaling: up to 200%
- No color-only information
- Error icons alongside text

### Form Accessibility
- Label-input association
- Required field indicators (*)
- Error messages linked to inputs
- Inline validation feedback

## Component States

### Input Fields
- Default: border-gray-300
- Focus: border-blue-500 ring-2
- Error: border-red-500 bg-red-50
- Success: border-green-500
- Disabled: bg-gray-100 opacity-50

### Buttons
- Default: bg-blue-600 text-white
- Hover: bg-blue-700
- Active: bg-blue-800
- Loading: opacity-75 with spinner
- Disabled: bg-gray-300 cursor-not-allowed

### Form Validation
- Real-time password strength
- Email format validation
- Inline error messages
- Success checkmarks
- Submit button disabled until valid

## Loading States
- Button spinners during submission
- Skeleton screens for redirects
- Progress indicators for multi-step
- Optimistic UI updates

## Error Handling
- Inline field validation
- Toast notifications for system errors
- Network error recovery prompts
- Session timeout warnings

## Security UI Elements
- Password visibility toggle
- Strength meter
- Session duration display
- Two-factor auth option (future)
- Rate limit feedback

## Metrics & Analytics
Track:
- Form completion rates
- Field error frequencies
- Social auth usage
- Time to complete
- Drop-off points

## Technical Specifications

### Colors
```css
--primary: #2563eb (blue-600)
--primary-hover: #1d4ed8 (blue-700)
--error: #dc2626 (red-600)
--success: #16a34a (green-600)
--text: #111827 (gray-900)
--text-secondary: #6b7280 (gray-500)
--background: #ffffff
--background-secondary: #f9fafb (gray-50)
```

### Typography
- Headings: Inter/System font, 600 weight
- Body: Inter/System font, 400 weight
- Input text: 16px (prevent mobile zoom)
- Error text: 14px

### Spacing
- Container padding: 24px mobile, 48px desktop
- Form field spacing: 24px
- Button padding: 12px 24px
- Card border-radius: 8px

### Animation
- Transitions: 150ms ease-in-out
- Loading spinner: 1s linear infinite
- Form shake on error: 150ms
- Success checkmark: 300ms ease

## Implementation Priority
1. **Critical (Issue #6):**
   - /login page structure
   - /signup page structure
   - Basic form validation
   - Supabase integration

2. **High Priority:**
   - Password reset flow
   - Remember me functionality
   - Mobile responsiveness
   - Error handling

3. **Medium Priority:**
   - Social auth providers
   - Password strength meter
   - Accessibility features
   - Loading states

4. **Low Priority:**
   - Animation polish
   - Advanced validation
   - Analytics tracking
   - Two-factor auth