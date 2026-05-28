# Testing Guide

## Focus Areas
- Error classification and mapping.
- Logger queue batching and persistence behavior.
- Form schema validation for product/profile/location/order/barter/search.
- Context action/state behavior for wallet, cart, and transaction feedback.

## Run Tests
```bash
npm test -- --run
```

## Recommended Targeted Runs
```bash
npm test -- --run src/lib/errorHandler.test.ts src/lib/validation.test.ts
```

## Notes
- Existing unrelated baseline test failures may exist in pre-existing suites.
- Ensure new tests cover changed behavior only.
