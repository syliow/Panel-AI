## 2026-02-06 - Linting Infrastructure & HTML Entities
**Learning:** Adding missing linting infrastructure (ESLint) exposed pre-existing issues with unescaped HTML entities in React components.
**Action:** When enabling new linters, expect and budget time for fixing existing violations.

## 2026-02-06 - Tooltips & Toggle Accessibility
**Learning:** Custom tooltips bound only to `onMouseEnter` exclude keyboard users, and custom toggle buttons without ARIA states confuse screen reader users.
**Action:** Always pair `onMouseEnter` with `onFocus`, and use `aria-pressed` for button-based toggles to ensure inclusive access.

## 2026-02-06 - Semantic Transcripts
**Learning:** Real-time transcripts implemented with `<div>` lack structure for screen readers. Using `<ul>` with `role="log"` and `aria-live="polite"` provides critical context and automatic announcements.
**Action:** Always use semantic list structures for dynamic chat or log interfaces.
