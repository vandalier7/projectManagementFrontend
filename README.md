# Project Dashboard — Frontend

Next.js 16 (App Router) + TypeScript + Tailwind client for Project Dashboard.
Data comes from the Laravel API in
[projectManagementSystem](https://github.com/vandalier7/projectManagementSystem)
and is fetched with SWR.

## Running it

```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
```

Or with Docker: `docker compose up` (serves on :3000).

Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.

## Structure

The app follows a component-based architecture organised by feature. `app/`
only handles routing; each page is a thin file that loads data and composes
feature components.

```
src/
├── app/                 Routes only (pages + layouts). Keep these thin.
├── features/            One folder per domain feature
│   ├── tasks/           Task lifecycle UI, shared everywhere a task appears
│   │   ├── api.ts       Typed wrappers for /tasks endpoints
│   │   ├── index.ts     Public exports — import from '@/features/tasks'
│   │   ├── components/  TaskDetailModal (+ parts), create/edit/reject modals, chips
│   │   ├── hooks/       useTaskHistory, useAsyncAction
│   │   └── lib/         permissions (mirrors the API's lifecycle rules), display constants
│   ├── board/           Kanban board: columns, cards, drag-to-reorder
│   ├── dashboard/       Home widgets: Prioritized Tasks, General
│   ├── projects/        Project data hooks, overview, settings sections
│   ├── members/         Project members page components
│   ├── timeline/        Completed-task timeline
│   ├── users/           User admin components
│   └── notifications/   Notification bell + dropdown
├── components/
│   ├── ui/              App-wide primitives: Modal, Button, Field, Avatar, rich text
│   ├── layout/          Shells, app bars, sidebars
│   └── feedback/        Loading / not-found / access-denied states
├── hooks/               App-wide hooks: useCurrentUser, useAuthGuard, useClickOutside
├── lib/                 api client, auth session, dates, theme helpers
└── types/               Shared domain types (Task, Project, User, …)
```

### Conventions

- **Types** live in `src/types`. Don't redeclare `Task`, `Project` and the like
  in components.
- **Data**: use the feature hooks (`useProject(id)`, `useProjects()`) and API
  wrappers (`taskApi`). Pages share one SWR cache entry per project, so
  switching tabs doesn't refetch.
- **Identity**: `useCurrentUser()` is for UI decisions only. Never send a user
  id to the API to say who is acting; the API reads it from the auth token.
- **Permissions**: `features/tasks/lib/permissions.ts` decides which task
  buttons to show. It mirrors the backend's `TaskLifecycleEngine`. If you
  change one, change the other.
- **Use the tasks feature through its public entry point**, `@/features/tasks`,
  not its internal files. Do the same for other features if they grow an
  `index.ts`.
