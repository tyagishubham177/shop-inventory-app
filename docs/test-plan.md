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
- Generated SQL stays on approved `chat_*` views
- Retry history is visible when the first SQL attempt fails or comes back empty

### Backup export

- Export route returns a file
- Export action is logged

## Phase 6 seeded chat checks

Use the Phase 6 dev seed file before running these checks, then apply the direct-chat SQL migration.

- Ask `What are total sales today?` and expect 6646 INR from 4 sales lines and 7 units.
- Ask `Which brand sold the most in the last 7 days?` and expect `SwiftStep`.
- Ask `Which brand sold the most overall?` and expect `Northwind`.
- Ask `How many T-Shirts do we have in stock?` and confirm the answer is based on the seeded T-Shirt products.
- Ask `Find Air Runner Pro.` and expect stock 18 and selling price 1900 INR.
- Ask `Show the low-stock products right now.` and confirm low-stock items include City Walk Classic, Trail Grip X, Winter Puff Vest, Everyday Cotton Tee Black, Gym Active Jogger, Linen Weekend Shirt, and Wool Scarf Grey.
- Ask `Show recent activity on the dashboard.` and confirm the answer reflects seeded sales and inventory transactions.
- Ask a Hinglish prompt like `last 7 days me kaunsi brand sabse zyada biki?` and confirm it still resolves correctly.
- Open the SQL panel and confirm the final query only references `chat_inventory_products`, `chat_sales_entries`, `chat_inventory_transactions`, or `chat_recent_activity`.
- Ask an unsupported write request like `Archive Air Runner Pro` and confirm the answer says chat is read-only.

## Human tester notes

For each phase, record:
- what was tested
- what passed
- what failed
- any screenshots or edge cases worth keeping