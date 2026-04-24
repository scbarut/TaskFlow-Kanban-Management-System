# Implementation Plan

- [x] 1. Fix BoardPage to await params before passing boardId


  - Make `BoardPage` an `async` function
  - Update `params` type to `Promise<{ boardId: string }>`
  - Destructure `boardId` after `await params`
  - Pass resolved `boardId` to `<KanbanBoard />`
  - _Requirements: 1.1, 1.2_

- [x] 2. Add boardId guard in KanbanBoard useEffect



  - Add a guard clause in `useEffect` to skip the fetch if `boardId` is falsy or equals the string `"undefined"`
  - _Requirements: 1.3, 1.4_

- [ ]* 3. Write property-based tests
  - [ ]* 3.1 Write property test for boardId is never undefined
    - **Property 1: boardId passed to KanbanBoard is never "undefined" or empty**
    - **Validates: Requirements 1.2**
  - [ ]* 3.2 Write property test for API request uses valid boardId
    - **Property 2: API request is not issued with an invalid boardId**
    - **Validates: Requirements 1.3**

- [ ] 4. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
