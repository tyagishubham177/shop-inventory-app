# Phase 1

## Goal

Implement auth, sessions, and role protection.

## Deliverables

- Password hashing helpers
- Session helpers
- Current-user resolver
- Login route
- Logout route
- Middleware protection
- Login screen

## Human verification

- Open `/` and confirm anonymous users are redirected to `/login`.
- Test valid login with the demo admin account shown on the login page.
- Test invalid login with a wrong password.
- Test protected route redirect after sign out.
- Test admin-only route blocking by signing in as staff and visiting `/admin`.
- Test admin-only route access by signing in as admin and visiting `/admin`.
