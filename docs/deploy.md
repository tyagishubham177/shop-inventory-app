# Deploy

## Environments

### Dev

- Local Next.js app
- Dev Supabase project
- Dev OpenAI key
- Local session secret

### Prod

- Hosted web app
- Prod Supabase project
- Prod OpenAI key
- Separate session secret

## Required runtime variables

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `SESSION_SECRET`

## Recommended platform path

- Start with local development plus preview deploys.
- Keep a production-safe target in mind before real shop usage.
- Do not reuse dev secrets in prod.

## Human setup checklist

- Create one Supabase project for dev and one for prod.
- Generate one session secret per environment.
- Add environment variables to the chosen deployment platform.
- Confirm the app URL matches the deployed environment.
- Enable GitHub Actions for the repo.
- Set workflow permissions to `Read and write` so rollback-tag workflows can push tags.
- Add branch protection or a ruleset for `master` that requires PRs, required checks, up-to-date branches, no force pushes, and no branch deletion.
- After the PR workflow runs once, mark `lint`, `typecheck`, and `build` as required checks for `master`.
