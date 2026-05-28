# Frontend API Notes

## Logging Endpoint
- Client logger posts batched logs to:
  - `POST /api/logs/client`
- Payload shape:
```json
{ "logs": [{ "id": "...", "level": "error", "message": "...", "context": {}, "timestamp": 0 }] }
```

## Error Classification
- Frontend categories:
  - `network`
  - `auth`
  - `validation`
  - `blockchain`
  - `wallet`
  - `unknown`

## Product/Order/Barter Flows
- Product forms submit through `productService`.
- Order creation submits through `useEscrowContract`.
- Barter form currently validates and builds payload client-side.
