# Requirements Document

## Introduction

The board detail page (`/dashboard/[boardId]`) issues a `GET /boards/undefined` request because the Next.js 13+ App Router treats `params` as a Promise. Accessing `params.boardId` synchronously in a server component resolves to `undefined` on the initial render, and that value is forwarded to the `KanbanBoard` client component, which immediately fires the API call with an invalid ID. This spec covers the fix: ensuring `boardId` is always a valid, resolved string before any API request is made.

## Glossary

- **App Router**: The Next.js 13+ file-system router that uses React Server Components and async layouts/pages.
- **Dynamic Route Segment**: A folder named `[boardId]` whose value is provided at runtime via the `params` object.
- **params Promise**: In Next.js 15+, `params` (and `searchParams`) are Promises that must be awaited before their properties can be read.
- **KanbanBoard**: The client component responsible for fetching and rendering a single board's data.
- **boardId**: The UUID string extracted from the dynamic route segment, used as the primary key for board API requests.
- **422 Unprocessable Entity**: The HTTP error returned by the backend when the path parameter `boardId` is the literal string `"undefined"`.

## Requirements

### Requirement 1

**User Story:** As a user, I want clicking a board card to open the correct board, so that I can view and manage that board's columns and cards without errors.

#### Acceptance Criteria

1. WHEN the board detail page renders, THE BoardPage component SHALL resolve the `params` Promise before passing `boardId` to child components.
2. WHEN `boardId` is resolved from `params`, THE BoardPage component SHALL pass a non-empty, non-`"undefined"` string to `KanbanBoard`.
3. WHEN `KanbanBoard` receives a valid `boardId`, THE KanbanBoard component SHALL issue the API request `GET /boards/{boardId}` exactly once on mount.
4. IF `boardId` is not yet available, THEN THE BoardPage component SHALL render a loading state instead of passing an invalid value to `KanbanBoard`.
5. WHEN the board API request completes successfully, THE KanbanBoard component SHALL display the board title and its columns.
