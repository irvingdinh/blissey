# blissey

## Project Structure

- `api/` — NestJS backend (npm)
- `ui/` — React + Vite frontend (bun)

## Commands

- `make dev` — Start both API and UI dev servers
- `make kill` — Kill processes on ports 3000 and 5173
- `make check` — Run lint, format, and build for both API and UI

## API Conventions

- **One-action-per-controller**: Each controller has a single method named `invoke`
- **Barrel exports**: Use `index.ts` files for re-exporting
- **Feature modules**: Organized with `controllers/`, `services/`, `dtos/` directories
- **Controller grouping**: Controllers are grouped by resource under `controllers/{resource}/`

## UI Conventions

- **Path alias**: `@/` maps to `./src/`
- **Lazy-loaded routes**: Routes use a `lazy` helper in `src/router.tsx`
- **React Query**: Use `@tanstack/react-query` for server state
- **Page structure**: `src/apps/{feature}/pages/{PageName}/{PageName}.tsx`

## Before Completing

Always run `make check` before completing any task.
