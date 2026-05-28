# Implementation Guide

## Error Handling
- Use `withErrorHandling` for async UI actions.
- Use `handleAppError` when handling sync failures.
- Use `toAppError` to render category-specific user messages.

## Logging
- Import `logger` from `src/lib/logger.ts`.
- Call `logger.error/info/warn/debug(message, context)`.
- Logs are batched, persisted locally, and sent to backend endpoint.

## Forms
1. Define schema in `src/lib/validation.ts`.
2. Initialize form with `useAppForm(schema, { defaultValues })`.
3. Use reusable components:
   - `FormInput`
   - `FormSelect`
   - `FormTextarea`
   - `FormErrorSummary`

## Context Optimization
- Prefer selector hooks where possible:
  - `useWalletSelector`
  - `useCartSelector`
  - `useTransactionFeedbackSelector`
- Use action hooks for dispatch behavior to avoid prop drilling.
