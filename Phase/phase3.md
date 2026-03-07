# Phase 3

## Goal

Implement inventory management workflows on top of the Phase 2 schema.

## Deliverables

- Inventory validation
- Inventory query helpers
- Inventory routes
- Inventory list screen
- Inventory create and edit screens
- Archive and restore flow
- Inventory transaction logging for stock changes

## Human verification

- Open `/inventory` and confirm the inventory workspace loads after sign-in.
- Create a product with a valid seeded category and confirm it appears in the list.
- Edit the same product and change stock, price, or notes, then confirm the saved values persist.
- Open the product detail view and confirm recent stock activity shows the adjustment.
- Archive the product and confirm it disappears from the default active list.
- Switch the inventory filter to archived items, restore the same product, and confirm it returns to the active list.
- Sign in as the viewer account and confirm inventory pages stay readable but write actions are blocked.
