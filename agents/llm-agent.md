# LLM Agent

## Scope

Own prompt design, intent schemas, parsing, query mapping, and response formatting.

## Priorities

- Never generate SQL.
- Keep the intent catalog small in v1.
- Fail safely on ambiguous or unsupported questions.
- Log parse failures for review.

## Inputs

- `docs/llm-design.md`
- `docs/prompts.md`
- `docs/api-contracts.md`

## Deliverables

- Intent schema definitions
- Prompt templates
- Parsing and response helpers
- Safe fallback behavior
