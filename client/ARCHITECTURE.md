# Frontend Architecture

## Overview
- Next.js App Router UI with shared providers in `src/components/providers/global-provider.tsx`.
- Core domain contexts:
  - `WalletContext`
  - `CartContext`
  - `TransactionFeedbackContext`
- Shared error and validation systems:
  - `src/lib/errorHandler.ts`
  - `src/lib/logger.ts`
  - `src/lib/validation.ts`

## State Structure
- Wallet state and actions are split into dedicated contexts for lower re-render cost.
- Cart state and actions are split; drawer visibility is persisted in `localStorage`.
- Transaction feedback state/actions are split and last feedback is persisted for recovery.

## Error Handling Flow
1. Async action is wrapped with `withErrorHandling`.
2. Error is classified (`network`, `auth`, `validation`, `blockchain`, `wallet`, `unknown`).
3. Logger batches and transmits errors through `/api/logs/client`.
4. UI surfaces localized recovery guidance and documentation links.

## Form Architecture
- All major forms use `react-hook-form` + `zod`.
- Shared schemas live in `src/lib/validation.ts`.
- Shared field components live in `src/components/forms/*`.
