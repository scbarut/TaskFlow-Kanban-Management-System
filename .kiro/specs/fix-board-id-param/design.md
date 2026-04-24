# Design Document: Fix Board ID Param

## Overview

In Next.js 13+ App Router (and required in Next.js 15+), the `params` object passed to page components is a Promise. The current `BoardPage` server component reads `params.boardId` synchronously, which yields `undefined` before the Promise resolves. That `undefined` string is forwarded to `KanbanBoard`, which immediately fires `GET /boards/undefined`, causing a 422 from the backend.

The fix is a one-file change: make `BoardPage` an `async` server component that `await`s `params` before passing `boardId` downstream.

## Architecture

```
Next.js App Router
└── /dashboard/[boardId]/page.tsx   ← async server component (FIXED)
    └── <KanbanBoard boardId={boardId} />   ← client component, unchanged
        └── api.get(`/boards/${boardId}`)   ← only fires with a valid UUID
```

No new components, stores, or API routes are needed. The entire fix lives in `page.tsx`.

## Components and Interfaces

### BoardPage (`frontend/src/app/dashboard/[boardId]/page.tsx`)

Current (broken):
```tsx
export default function BoardPage({ params }: { params: { boardId: string } }) {
  return <KanbanBoard boardId={params.boardId} />;
}
```

Fixed:
```tsx
export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return <KanbanBoard boardId={boardId} />;
}
```

Key changes:
- Function is marked `async`
- `params` type is `Promise<{ boardId: string }>` (Next.js 15+ requirement)
- `boardId` is destructured after `await params`, guaranteeing it is a resolved string

### KanbanBoard (`frontend/src/components/kanban/KanbanBoard.tsx`)

No changes required. The component already guards against invalid state with its `loading` flag and only fires the fetch inside `useEffect` after mount.

## Data Models

No data model changes. `boardId` remains a `string` (UUID) throughout.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: boardId passed to KanbanBoard is never "undefined" or empty
*For any* navigation to `/dashboard/[boardId]`, the string received by `KanbanBoard` as its `boardId` prop SHALL be a non-empty string that is not the literal value `"undefined"`.
**Validates: Requirements 1.2**

Property 2: API request is not issued with an invalid boardId
*For any* render of `KanbanBoard`, if the `boardId` prop is a valid non-empty string, the component SHALL issue exactly one `GET /boards/{boardId}` request on mount, and SHALL NOT issue any request where the path contains `"undefined"`.
**Validates: Requirements 1.3**

## Error Handling

- If `await params` throws (which Next.js does not do in practice for route params), the error will bubble to the nearest error boundary — acceptable default behavior.
- If the resolved `boardId` does not correspond to an existing board, the backend returns 404; `KanbanBoard` already handles this by catching the error, showing a toast, and redirecting to `/dashboard`.

## Testing Strategy

### Unit / Example Tests

- Render `BoardPage` with a mock `params` Promise that resolves to `{ boardId: "abc-123" }` and assert that `KanbanBoard` receives `boardId="abc-123"`.
- Render `BoardPage` and assert that no API call is made before `params` resolves.

### Property-Based Testing

Property-based testing library: **fast-check** (already available in the JS ecosystem; install with `npm i -D fast-check`).

Each property-based test MUST be tagged with:
`// Feature: fix-board-id-param, Property {N}: {property_text}`

Each test MUST run a minimum of 100 iterations (fast-check default).

**Property 1 test** — generate arbitrary strings as `boardId` values (including `"undefined"`, empty string, whitespace) and assert that `BoardPage` never forwards a falsy or `"undefined"` value to `KanbanBoard`.

**Property 2 test** — generate valid UUID-like strings, mount `KanbanBoard` with each, and assert the intercepted API URL never contains `"/boards/undefined"`.
