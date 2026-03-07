# UI Spec

## Design goals

- Mobile-first
- Fast one-hand usage
- Clear touch targets
- Low visual noise
- Fast access to stock and sales actions

## Main screens

### Login

- Email field
- Password field
- Sign in button
- Clear invalid-credential feedback

### Dashboard

- Summary cards
- Low-stock list
- Recent activity
- Quick links to inventory, sales, chat, and backup export

### Inventory list

- Search bar
- Filter chips
- Product cards or compact rows
- Floating or sticky add button on mobile

### Inventory detail and form

- Product essentials first
- Stock and pricing fields grouped clearly
- Archive and restore actions separated from save actions

### Sales list and form

- Date filters and quick totals
- Manual and linked entry modes
- Multi-line entry only if it remains simple on mobile

### Chat

- Single input box
- Suggested example questions
- Answer area with optional result summary
- Empty state explaining read-only limits

## UI behavior notes

- Use confirmation for destructive actions.
- Prefer bottom-sheet style mobile interactions where helpful.
- Keep table-heavy layouts collapsible on small screens.
- Show role-limited actions only to allowed users.
