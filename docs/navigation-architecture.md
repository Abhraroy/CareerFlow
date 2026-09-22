# JobCopilot Navigation Architecture

This document describes the centralized, strongly-typed navigation architecture of the JobCopilot Electron application.

---

## 1. Core Principles

1. **State-Driven Navigation**: Route transitions are driven by Zustand state (`useNavigationStore`), not string URLs or prop-drilled callbacks.
2. **Component Decoupling**: React UI components (like `Sidebar`) request navigation using typed helpers (`goToJobMatch`, `goToPortal`, etc.); they do not execute portal switching or IPC logic directly.
3. **Electron Boundary Isolation**: Electron `WebContentsView` lifecycle & visibility operations are managed exclusively by `PortalController.ts`.
4. **App vs. Portal Browser History**: Application navigation history stack (navigating between Settings, Resumes, Portals, and Job Matches) is isolated from embedded portal WebContentsView browser history (Back, Forward, Reload).

---

## 2. Architecture Overview

```text
                    ┌──────────────────┐
                    │  React UI (e.g.  │
                    │   Sidebar.tsx)   │
                    └────────┬─────────┘
                             │ navigate(route) / goToResume(...)
                             ▼
                ┌──────────────────────────┐
                │  useNavigationStore      │
                │                          │
                │  - currentRoute          │
                │  - history stack         │
                │  - navigate() / goBack() │
                └────────────┬─────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
       Internal Route                  Portal Route
              │                             │
              ▼                             ▼
    NavigationRenderer.tsx           PortalController
              │                             │
              ▼                             ▼
          React View                  window.api.switchPortal
                                            │
                                            ▼
                                     WebContentsView
```

---

## 3. Route Model (`types.ts`)

Routes are represented as a discriminated union:

```typescript
export type InternalRoute =
  | { type: 'settings' }
  | { type: 'api-usage' }
  | { type: 'all-matches' }
  | { type: 'job-match'; matchId: string }
  | { type: 'resume'; resumeName: string }

export type PortalRoute = {
  type: 'portal'
  portalId: string
}

export type AppRoute = InternalRoute | PortalRoute
```

---

## 4. How to Navigate

Use the `useNavigation` hook in any React component:

```tsx
import { useNavigation } from '../navigation/useNavigation'

function MyComponent() {
  const { route, navigate, goToResume, goToJobMatch, goToPortal, goBack } = useNavigation()

  return (
    <div>
      <button onClick={() => goToResume('My_Resume')}>Open Resume</button>
      <button onClick={() => goToPortal('linkedin')}>Open LinkedIn</button>
      <button onClick={() => goToJobMatch('match-123')}>View Job Match</button>
      <button onClick={goBack}>Go Back</button>
    </div>
  )
}
```

---

## 5. How to Add a New Internal Page

1. **Update `types.ts`**:
   Add the new route type to `InternalRoute`:
   ```typescript
   export type InternalRoute =
     | ...
     | { type: 'my-new-page'; itemParam?: string }
   ```
2. **Update `NavigationRenderer.tsx`**:
   Add a new `case 'my-new-page':` in the `switch (route.type)` statement and return your React component.
3. **Navigate to the page**:
   Invoke `navigate({ type: 'my-new-page', itemParam: 'abc' })`.

---

## 6. How to Add a New Job Portal

1. **Update `constants.ts`**:
   Add the portal metadata to `PORTALS`:
   ```typescript
   { id: 'myportal', label: 'My Portal', url: 'https://myportal.com/jobs', logo: getLogo('myportal') }
   ```
2. **Update Main Process (`src/main/index.ts`)**:
   Add default fallback URL logic in `ipcMain.on('portal:switch', ...)` if applicable.
3. **Navigate to the portal**:
   `goToPortal('myportal')`. `PortalController` and `NavigationRenderer` automatically handle showing and positioning the `WebContentsView`.

---

## 7. App History vs. Portal Browser History

- **App History**: Handled by `useNavigationStore`. Navigating across views pushes `AppRoute` entries to an internal history stack (`history: AppRoute[]`). Calling `goBack()` / `goForward()` moves between screens in the application.
- **Embedded Portal History**: Embedded portal instances (`LinkedIn`, `Greenhouse`, etc.) run inside Electron `WebContentsView`. Controls in `BrowserControlHeader.tsx` send IPC messages (`window.api.navigate('back' | 'forward' | 'reload')`) directly to the active `WebContentsView` instance without mutating App history.

---

## 8. State Location

- **Navigation State**: Lives in `useNavigationStore` (`src/renderer/src/navigation/navigationStore.ts`).
- **Core App / Domain Data**: Lives in `useAppStore` (`src/renderer/src/lib/zustandStore.ts`).
- **UI State**: Sidebar collapse and panel tabs (`sidebarTab: 'match' | 'quickfill'`) live in local or domain store.
