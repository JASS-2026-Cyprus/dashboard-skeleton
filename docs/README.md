# Deployment Documentation

## Overview

The cockpit-dashboard is a shared React frontend deployed on `server2026.jass.school`. Four independent subsystems (Air Quality, Water Quality, Maintenance, Earthquake) each have their own backend. The frontend uses build-time configuration injection to point to different backend URLs per environment.

## Quick Start

### Local Development

1. Create `.env.local` in the project root:
   ```env
   AIR_QUALITY_BACKEND_URL=http://localhost:3001
   WATER_QUALITY_BACKEND_URL=http://localhost:3002
   MAINTENANCE_BACKEND_URL=http://localhost:3003
   EARTHQUAKE_BACKEND_URL=http://localhost:3004
   ```

2. Run docker-compose:
   ```bash
   docker-compose up
   ```

3. Open http://localhost:8000

### Production

1. Set 4 GitHub Secrets in repo settings (Settings → Secrets and variables → Actions):
   - `AIR_QUALITY_BACKEND_URL`
   - `WATER_QUALITY_BACKEND_URL`
   - `MAINTENANCE_BACKEND_URL`
   - `EARTHQUAKE_BACKEND_URL`

2. Push to main — GitHub Actions will build and deploy automatically

## Using in Components

```typescript
import { getSubsystemBackendUrl } from './config'

export function AirQualityWidget() {
  React.useEffect(() => {
    const backendUrl = getSubsystemBackendUrl('airQuality')
    fetch(`${backendUrl}/api/data`)
      .then(res => res.json())
      .then(setData)
  }, [])

  return <div>{/* render data */}</div>
}
```

## How It Works

- `.env.local` and GitHub Secrets provide backend URLs
- Docker build receives these as a `SUBSYSTEMS_CONFIG` build arg
- `config.json` is generated at build time and baked into the image
- React loads `config.json` before rendering (in `src/main.tsx`)
- Components call `getSubsystemBackendUrl('subsystemName')` to get backend URLs

## Files

- `Dockerfile` — Multi-stage build with config injection
- `docker-compose.yml` — Local dev with env var substitution
- `.github/workflows/deploy.yml` — Production build and deploy
- `src/config.ts` — Config loading and helper functions
- `src/main.tsx` — Loads config before rendering
- `nginx.conf` — Serves SPA and config.json
- `.env.local` — (git-ignored) Local backend URLs
