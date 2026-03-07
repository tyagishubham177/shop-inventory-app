# API Contracts

## Auth

### POST /api/auth/login

Request:
- email
- password

Response:
- user summary
- session established via cookie

### POST /api/auth/logout

Response:
- session cleared

## Inventory

### GET /api/inventory

Supports filters for query, category, brand, archived, low_stock, and pagination.

### POST /api/inventory

Creates a product record.

### GET /api/inventory/:id

Returns a single product plus recent stock activity.

### PATCH /api/inventory/:id

Updates editable product fields.

### POST /api/inventory/:id/archive

Archives a product.

### POST /api/inventory/:id/restore

Restores a product.

## Sales

### GET /api/sales

Supports date range, category, brand, mode, and pagination filters.

### POST /api/sales

Creates one or more sale line items.

### GET /api/sales/:id

Returns a single sale entry.

### PATCH /api/sales/:id

Allows limited correction fields if the business flow permits edits.

## Dashboard

### GET /api/dashboard/summary

Returns low-stock count, inventory totals, recent sales totals, and quick highlights.

## Chat

### POST /api/chat/query

Request:
- question

Response:
- parsed intent
- answer text
- optional tabular summary for UI rendering

## Backups

### POST /api/backups/export

Creates and streams a CSV export and logs the action.

## Validation rules

- Validate inputs before database access.
- Return clear 4xx errors for bad requests.
- Enforce auth and role checks on every protected route.
- Add simple rate limiting to chat and auth endpoints.
