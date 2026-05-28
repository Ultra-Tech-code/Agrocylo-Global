# Deployment Guide

## Build
```bash
npm ci
npm run build
```

## Required Runtime Environment
- `NEXT_PUBLIC_NATIVE_TOKEN_CONTRACT_ID`

## Operational Notes
- Configure backend route for client log ingestion (`/api/logs/client`).
- Keep browser localStorage available for state/log persistence features.
