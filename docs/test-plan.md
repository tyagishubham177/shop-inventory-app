# Test Plan

## Test levels

- Manual smoke testing for every phase
- Route-level validation tests when code exists
- Basic auth, inventory, sales, and chat regression checks

## Manual smoke checklist

### Auth

- Valid user can sign in
- Invalid password is rejected
- Protected routes require auth
- Role-restricted actions stay hidden or blocked

### Inventory

- Product create, edit, archive, and restore work
- Stock adjustments update current stock and transaction history
- Search and filters work on mobile

### Sales

- Linked and manual sales can be created
- Totals are correct
- Date filtering works

### Chat

- Supported questions return answers
- Unsupported questions fail safely
- No write action is possible through chat

### Backup export

- Export route returns a file
- Export action is logged

## Human tester notes

For each phase, record:
- what was tested
- what passed
- what failed
- any screenshots or edge cases worth keeping
