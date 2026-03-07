# Prompt Notes

## SQL planning prompt goals

- Understand inventory, sales, dashboard, and activity questions
- Support English, Hindi, and Hinglish
- Return a single read-only SQL statement plus a short plan summary
- Stay inside the approved `chat_*` views

## SQL repair prompt goals

- Use execution feedback to revise broken or empty queries
- Keep every retry read-only and single-statement
- Avoid repeating the same failed shape when the error is actionable

## Response generation prompt goals

- Use only database results
- Avoid hallucinations
- Keep responses concise and useful
- State when no matching records are found

## Prompt categories

- inventory lookup
- sales lookup
- dashboard summary
- recent activity
- comparative period analysis