# MCollector

Simple HTML/CSS/JS web app for displaying data collected using [MCollector](https://github.com/project-mcollector/mcollector)

## Run

```bash
pnpm install
pnpm dev
```

Opens the web app on `http://localhost:3000`

## Lint

```bash
pnpm lint        # check for errors
pnpm lint:fix    # auto-fix where possible
```

Runs ESLint over `apps/web/src/js/**/*.js`. Config is at `apps/web/eslint.config.js`.

## Project Structure

- `apps/web` — Vanilla JS frontend

## Design Decisions

### Routing without a framework

| Option            | Notes                                                  |
| ----------------- | ------------------------------------------------------ |
| Page reload       | Simple, but full-page reloads break UX                 |
| Hash routing      | No server config needed, but URLs are ugly (`/#/page`) |
| **History API** ✓ | Clean URLs, true SPA feel                              |

History API was chosen to keep URLs clean and avoid the visual noise of hash fragments

### State management

| Option             | Notes                                          |
| ------------------ | ---------------------------------------------- |
| Global object      | Simple but no reactivity                       |
| CustomEvent        | Decoupled but verbose for fine-grained updates |
| **Custom store** ✓ | Lightweight reactive state without a framework |

A minimal custom store was built to get reactivity (components re-render on state change) without pulling in a full framework

### Auth token storage

| Option             | Notes                                                       |
| ------------------ | ----------------------------------------------------------- |
| `httpOnly` cookie  | Best XSS protection, but requires server to set the cookie  |
| In-memory          | Safe from XSS, but tokens are lost on page refresh          |
| **localStorage** ✓ | Simple, survives refresh, works with a pure static frontend |

Since the frontend is static and has no server-side component, `httpOnly` cookies were not an option. `localStorage` was chosen with an `authFetch` wrapper that automatically refreshes expired access tokens, keeping a single refresh in-flight at a time to avoid race conditions

### CSS theming

| Option                      | Notes                                         |
| --------------------------- | --------------------------------------------- |
| Separate dark stylesheet    | Simple but duplicates all rules               |
| CSS-in-JS / utility class   | Requires a build step or framework            |
| **CSS custom properties** ✓ | Native, no build step, single source of truth |

All colors are defined as CSS custom properties in `:root` and overridden inside `@media (prefers-color-scheme: dark)`, so dark mode is handled entirely by the browser with no JavaScript
