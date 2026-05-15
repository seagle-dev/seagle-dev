# CLAUDE.md (Compressed)

## Overview
Full-stack ed-tech: PDF textbooks + 3D model annotations.
- `client/`: RN (Expo) mobile
- `server/`: Express API
- `web/`: React (Vite) admin portal
**Ref: [BEST_PRACTICES.md](./BEST_PRACTICES.md) [GEMINI.md](./GEMINI.md)**

## Tech Stack
- **Mobile:** Expo 54, RN 0.81, expo-router, AsyncStorage.
- **Web:** React 19, Vite 7, RRD 7, Three.js.
- **Backend:** Express 5, MySQL (mysql2), Firebase Admin.
- **Auth:** JWT, bcrypt, Firebase Auth.
- **Storage:** Supabase Storage (Files), MySQL (Metadata).

## Structure
- **Client:** `app/` (routing), `assets/`, `services/api.js`.
- **Server:** `src/` (`controllers/`, `services/`, `routes/`, `models/`, `middleware/`).
- **Web:** `src/` (`pages/`, `component/`, `services/api.js`).

## API Summary
- **Auth (`/api/auth`):** `/register`, `/login`, `/firebase`, `/auto`, `/refresh`, `/profile`.
- **Admin (`/api/admin`):** `/books`, `/models`, `/mappings` (CRUD).
- **Public:** `/home`, `/library/books`, `/library/models`.

## Storage & Files
- **PDF -> Cover:** Server-side `pdfjs-dist` + `canvas`.
- **3D:** `.glb`/`.gltf` with auto-thumbnail capture.
- **Access:** Backend proxies Supabase streams.

## Commands
- **Server:** `npm run dev`
- **Web:** `npm run dev`
- **Mobile:** `npx expo start`
