# GitHub Copilot Instructions

Copilot should defer to this project order of truth:

1. `AGENTS.md`
2. `DECISIONS.md`
3. `docs/design.md`
4. `docs/schema.md`
5. `docs/llm-design.md`
6. `docs/api-contracts.md`
7. `docs/ui-spec.md`
8. `TASKS.md`

Project rules:
- Keep changes phase-scoped.
- Favor explicit server logic over vague abstractions.
- Do not invent unsupported product features.
- Do not allow the model to generate raw SQL.
