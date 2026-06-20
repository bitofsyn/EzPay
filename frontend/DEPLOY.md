# Frontend Deployment

This frontend uses Vite and builds static files into `dist/`.

## Build

```bash
cd frontend
npm run build
```

Build output:

- directory: `frontend/dist`
- upload target: upload the files inside `dist/`, not the `dist` folder itself

## Environment Variables

Vite only exposes variables prefixed with `VITE_`.

Use `frontend/.env` as the single source of truth.

Example production values for `frontend/.env`:

```env
VITE_API_BASE_URL=https://your-backend-service.onrender.com
VITE_AI_SERVICE_URL=https://your-ai-category-service.example.com
VITE_AI_ASSISTANT_URL=https://your-ai-assistant-service.example.com
VITE_SENTRY_DSN=
```

Local development values for `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8081
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_AI_ASSISTANT_URL=http://localhost:8001
```

## Router / CloudFront

This app uses `BrowserRouter`.

For direct URL access and refresh to work in CloudFront:

- map `403` to `/index.html` with response code `200`
- map `404` to `/index.html` with response code `200`

Without this, refreshing a nested route will fail even if the app works from `/`.

## Deployment Checks

1. Open the CloudFront domain and confirm the app loads.
2. Refresh a nested route such as `/login` or `/dashboard`.
3. Open browser devtools and confirm API calls go to `VITE_API_BASE_URL`, not `localhost`.
4. If old assets are still served, create a CloudFront invalidation with `/*`.

## Cache Invalidation

- CloudFront invalidation path: `/*`
