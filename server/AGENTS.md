# AGENTS.md

## Project Overview

Juror Bureau Portal is a Node.js, Express, and Nunjucks frontend application for MoJ/HMCTS juror management workflows.

Primary areas:
- `server/` - Express app, routes, controllers, domain objects, validation, helpers
- `client/templates/` - Nunjucks templates
- `client/scss/` - styling
- `client/assets/` - static assets
- `config/` and `dev/config/` - environment configuration
- `redis/docker-compose.yml` - local Redis support

## Working Rules

- Read the surrounding code before editing. Prefer existing controller/object/template patterns over new abstractions.
- Keep changes small and focused on the requested task.
- Do not reformat unrelated files or churn generated assets.
- Do not revert user changes. Check `git status --short` before making broad edits.
- Preserve CommonJS style unless the touched area already uses another style.
- Use 2-space indentation, semicolons, single quotes, and existing naming conventions.
- Be careful with session data, auth data, juror numbers, court location codes, and user-facing MoJ/GOV.UK wording.

## Setup And Commands

Package manager:
- Use Yarn, not npm.
- Project uses Yarn 4 via `.yarn/releases/yarn-4.10.3.cjs`.
- Run `corepack enable` if Yarn is unavailable.

Common commands:
- Install: `yarn install`
- Build dev bundle: `yarn build`
- Build production bundle: `yarn build:prod`
- Run locally: `yarn dev`
- Run with restart: `yarn dev:watch`
- Lint: `yarn lint`

Node version note:
- `package.json` currently says Node `>=22`.
- README mentions Node 20.
- GitHub Actions currently uses Node 18.
- If a command fails because of Node version mismatch, report that explicitly instead of silently changing versions.

Testing note:
- `package.json` test scripts are currently placeholders.
- There are many legacy `*.spec.js` files using Chai/Sinon and `mocha.conf.js`.
- Before claiming tests pass, verify the available local test command.
- For targeted specs, prefer the existing local pattern if present, for example using Mocha with `mocha.conf.js`.
- If no reliable test command is available, say exactly what was and was not run.

## Development Guidance

When changing routes/controllers:
- Follow existing route/controller/object separation.
- Keep API calls in object modules where that is the local pattern.
- Use `app.namedRoutes.build(...)` for internal URLs.
- Preserve existing 404 handling for juror access boundaries.
- Keep logging useful but avoid logging unnecessary personal data.

When changing templates:
- Follow GOV.UK/MoJ frontend conventions already used in nearby templates.
- Keep visible content concise and user-task focused.
- Ensure validation errors, back links, hidden inputs, and CSRF/session-driven fields continue to work.
- Match existing macro and partial usage before creating new template structure.

When changing validation:
- Add or update focused specs in the matching `server/config/validation/*.spec.js` file where practical.
- Keep error messages consistent with existing wording.

When changing frontend styling:
- Prefer existing SCSS utilities and component conventions.
- Avoid broad visual redesign unless explicitly requested.
- Check that content remains usable on narrow screens.

## Review Guidance

When asked to review code, use a code-review stance.

Prioritise:
- Bugs or behaviour regressions
- Security, auth, session, or data leakage risks
- Broken routes, named routes, redirects, or form submissions
- Validation gaps
- Missing or weak tests
- Accessibility or GOV.UK/MoJ pattern issues
- Build, lint, or dependency risks

Review response format:
1. Findings first, ordered by severity.
2. Include file and line references.
3. Explain the user-visible or operational impact.
4. Mention test gaps or commands not run.
5. Keep summaries brief and secondary.

If no issues are found, say that clearly and mention any residual risk.

## Pull Request Expectations

Before considering work complete:
- Check `git diff` for unintended changes.
- Run the most relevant available verification command.
- Update or add tests when behaviour changes and a test pattern exists.
- Update README or docs only when the change affects setup, commands, or user-facing behaviour.

PR notes should include:
- What changed
- Why it changed
- How it was verified
- Any known limitations
