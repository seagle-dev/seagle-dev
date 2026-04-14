# CLAUDE.md — Seagle Development Guide

## Project Overview

Seagle is a full-stack educational platform that combines PDF textbooks with interactive 3D model annotations. It consists of three applications:

- **`client/`** — React Native (Expo) mobile app for learners
- **`server/`** — Express.js REST API backend
- **`web/`** — React (Vite) admin portal for content management

---

## Folder Structure

```
seagle-dev/
├── client/                          # Mobile app (React Native + Expo)
│   ├── app/
│   │   ├── _layout.jsx             # Root layout (Stack navigator)
│   │   ├── index.jsx               # Entry point (auth redirect)
│   │   ├── auth/
│   │   │   └── Auth.jsx            # Login/register screen
│   │   ├── components/
│   │   │   ├── BookListing.jsx     # Book list with sections
│   │   │   ├── NavigationBar.jsx   # Bottom tab bar
│   │   │   └── TopHeader.jsx       # Header component
│   │   ├── screens/
│   │   │   ├── Home.jsx
│   │   │   ├── SignUpScreen.jsx
│   │   │   └── SuccessScreen.jsx
│   │   └── tabs/
│   │       ├── _layout.jsx         # Tab wrapper (SafeArea)
│   │       ├── index.jsx           # Home tab
│   │       ├── SelectRole.jsx
│   │       ├── Reader.jsx
│   │       └── book/
│   │           └── BookDetails.jsx
│   ├── assets/
│   │   └── fonts/                  # FunnelSans, StixTwoTexts
│   ├── app.json                    # Expo config
│   ├── babel.config.js
│   └── package.json
│
├── server/                          # Backend API (Express.js)
│   ├── server.js                   # Entry point
│   ├── src/
│   │   ├── app.js                  # Express app setup, middleware, routes
│   │   ├── config/
│   │   │   ├── db.js               # MySQL connection pool
│   │   │   └── firebase.js         # Firebase Admin SDK init
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── home.controller.js
│   │   │   └── library.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   └── admin.middleware.js  # Admin role check
│   │   ├── models/
│   │   │   └── user.model.js       # User DB operations
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── home.routes.js
│   │   │   └── library.routes.js
│   │   └── services/
│   │       ├── admin.service.js
│   │       ├── storage.service.js   # Firebase Storage ops
│   │       ├── pdfCover.service.js  # PDF → cover image
│   │       ├── pdfDetection.service.js
│   │       ├── home.service.js
│   │       └── library.service.js
│   ├── script/
│   │   └── scripts.js              # JWT generation script
│   ├── static/assets/              # Sample static files
│   └── package.json
│
├── web/                             # Admin portal (React + Vite)
│   ├── src/
│   │   ├── main.jsx                # React entry point
│   │   ├── App.jsx                 # Router setup
│   │   ├── component/
│   │   │   ├── PdfAnnotator.jsx    # PDF annotation UI
│   │   │   ├── BookViewer.jsx      # PDF reader
│   │   │   ├── ThreeModelViewer.jsx # 3D model viewer (Three.js)
│   │   │   └── ModelThumbnailCapture.jsx
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx       # Admin panel
│   │   │   └── ViewerPage.jsx      # Book viewer
│   │   ├── services/
│   │   │   └── api.js              # Axios client + API functions
│   │   └── assets/
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── CLAUDE.md                        # This file
└── README.md
```

---

## Tech Stack

| Layer       | Technology                                             |
| ----------- | ------------------------------------------------------ |
| Mobile      | React Native 0.81, Expo 54, expo-router, AsyncStorage  |
| Web Admin   | React 19, Vite 7, React Router DOM 7, Three.js         |
| Backend     | Express 5, MySQL (mysql2), Firebase Admin SDK           |
| Auth        | JWT (jsonwebtoken), bcrypt, Firebase Auth               |
| Storage     | Firebase Cloud Storage                                  |
| PDF         | pdfjs-dist, canvas (server-side rendering)              |
| 3D          | Three.js, @react-three/fiber, @react-three/drei         |
| File Upload | multer                                                  |

---

## Naming Conventions

| What                  | Convention     | Example                        |
| --------------------- | -------------- | ------------------------------ |
| React components      | PascalCase     | `BookListing.jsx`              |
| Pages                 | PascalCase     | `AdminPage.jsx`                |
| Controllers           | dot.notation   | `auth.controller.js`           |
| Routes                | dot.notation   | `auth.routes.js`               |
| Services              | dot.notation   | `storage.service.js`           |
| Middleware             | dot.notation   | `auth.middleware.js`           |
| Models                | dot.notation   | `user.model.js`                |
| Config files          | dot.notation   | `db.js`, `firebase.js`         |
| Variables/functions   | camelCase      | `getBooks`, `uploadBook`       |
| Database columns      | snake_case     | `cover_image`, `created_at`    |
| API endpoints         | lowercase      | `/api/admin/books`             |
| File extensions       | `.jsx` for React, `.js` for Node |                  |

---

## Architecture & Patterns

### Backend (Express)

**Request flow:** `Route → Middleware → Controller → Service → DB/Firebase`

- **Routes** — Define endpoints and attach middleware. Keep thin.
- **Controllers** — Handle HTTP req/res. Parse input, call services, send responses.
- **Services** — Business logic. Database queries, Firebase operations, processing.
- **Middleware** — Cross-cutting concerns (auth, admin check).
- **Models** — Database query abstractions.
- **Config** — Connection setup (MySQL pool, Firebase Admin).

```
POST /api/admin/books
  → auth.middleware (verify JWT)
  → admin.middleware (check role)
  → admin.controller.uploadBook (parse multipart)
  → admin.service.uploadBook (process PDF, generate cover, store)
  → response
```

### Frontend — Web (React + Vite)

- **Pages** — Container components with state and API calls.
- **Components** — Reusable UI pieces (viewers, annotators).
- **Services** — API client functions (Axios-based).
- **Routing** — React Router DOM with `<BrowserRouter>`.
- **State** — Local `useState`. No global state library.
- **Styling** — Inline style objects. Minimal CSS files for globals.

### Frontend — Mobile (Expo)

- **Routing** — File-based with expo-router (app/ directory).
- **Layouts** — `_layout.jsx` files for Stack/Tab navigation.
- **Components** — Shared UI in `app/components/`.
- **State** — Local `useState`, AsyncStorage for persistence.
- **Styling** — `StyleSheet.create()` with inline objects.
- **Fonts** — Custom fonts loaded via `expo-font` (FunnelSans, STIXTwoText).

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Path        | Description               | Auth |
| ------ | ----------- | ------------------------- | ---- |
| POST   | /register   | Register new user         | No   |
| POST   | /login      | Login (email + password)  | No   |
| POST   | /firebase   | Login via Firebase token  | No   |
| GET    | /auto       | Dev auto-login            | No   |
| POST   | /refresh    | Refresh JWT token         | Yes  |

### Admin (`/api/admin`) — Requires auth + admin role
| Method | Path                       | Description              |
| ------ | -------------------------- | ------------------------ |
| GET    | /books                     | List all books           |
| POST   | /books                     | Upload book PDF          |
| GET    | /books/:id/pdf             | Stream PDF file          |
| GET    | /books/:id/cover           | Stream cover image       |
| GET    | /books/:id/detect-images   | Detect images on page    |
| DELETE | /books/:id                 | Delete book              |
| GET    | /models                    | List 3D models           |
| POST   | /models                    | Upload GLB/GLTF model    |
| GET    | /models/:id/file           | Stream model file        |
| GET    | /models/:id/thumbnail      | Stream thumbnail         |
| POST   | /models/:id/thumbnail      | Upload thumbnail         |
| DELETE | /models/:id                | Delete model             |
| POST   | /mappings                  | Create annotation        |
| GET    | /mappings                  | Get annotations          |
| DELETE | /mappings/:id              | Delete annotation        |

### Public (`/api/home`, `/api/library`)
| Method | Path            | Description         | Auth |
| ------ | --------------- | ------------------- | ---- |
| GET    | /home           | Home data           | No   |
| GET    | /library/books  | Public book listing | No   |
| GET    | /library/models | Public model listing| No   |

---

## Authentication

1. User registers/logs in → backend issues JWT (24h expiry)
2. Token stored in `localStorage` (web) or `AsyncStorage` (mobile)
3. Sent on every request: `Authorization: Bearer <token>`
4. `auth.middleware.js` verifies token, attaches `req.user`
5. `admin.middleware.js` checks `req.user.role` is `admin` or `superadmin`

**Roles:** `learner`, `admin`, `superadmin`

---

## Environment Variables

### Server (`server/.env`)
```env
# Database
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=24h

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_STORAGE_BUCKET=

# App
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173

# Dev only
AUTO_LOGIN_EMAIL=
AUTO_LOGIN_PASSWORD=
```

---

## Development Commands

### Server
```bash
cd server
npm install
npm run dev          # Start with nodemon
npm start            # Start without nodemon
```

### Web Admin
```bash
cd web
npm install
npm run dev          # Vite dev server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Mobile Client
```bash
cd client
npm install
npx expo start       # Start Expo dev server
npx expo start --android
npx expo start --ios
```

---

## Coding Standards

### React (Web + Mobile)

- Use **functional components** with hooks. No class components.
- Keep components focused — one responsibility per component.
- Place API calls in page-level components or services, not in presentational components.
- Use `.jsx` extension for all React files.
- Destructure props at the function parameter level.
- Use `useEffect` cleanup to prevent memory leaks.
- Handle loading and error states for async operations.

### Express (Backend)

- Use **async/await** with try/catch in controllers.
- Return consistent JSON responses: `{ data: ... }` or `{ message: "error" }`.
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500).
- Keep controllers thin — delegate logic to services.
- Validate input at the controller level before passing to services.
- Use parameterized queries (via mysql2) to prevent SQL injection.
- Stream files instead of loading entirely into memory.
- Handle multer errors in the global error handler.

### General

- No TypeScript — project uses plain JavaScript with `.js`/`.jsx`.
- No semicolons are inconsistently used — follow the existing file's style.
- Use `const` for values that don't change, `let` when reassignment is needed.
- Prefer template literals over string concatenation.
- Keep functions small and single-purpose.
- Use descriptive variable names — avoid abbreviations.

---

## Database

- **Engine:** MySQL
- **Connection:** Pool-based via `mysql2/promise`
- **Tables:** `users`, `books`, `models`, `mappings`
- **Column naming:** `snake_case`
- **Timestamps:** `created_at`, `updated_at`

---

## File Storage

- Files (PDFs, 3D models, covers, thumbnails) are stored in **Firebase Cloud Storage**.
- Backend stores GCS paths in the database (not signed URLs).
- Files are served through Express proxy endpoints with auth protection.
- Upload flow: `client → multer (memory) → service → Firebase Storage → DB path saved`

---

## Key Design Decisions

1. **Proxy pattern for files** — Backend streams files from Firebase rather than exposing signed URLs directly. This centralizes access control.
2. **Auto-generated covers** — PDF first page is rendered server-side via `pdfjs-dist` + `canvas` to create book cover images.
3. **Annotation system** — Admins annotate PDF regions and map them to 3D models. Stored as coordinate-based mappings in the database.
4. **Multi-app monorepo** — Three apps share one repo but have independent `package.json` files. No shared packages or workspace config.
5. **File-based routing (mobile)** — expo-router maps file structure to navigation. `_layout.jsx` files define navigation containers.
6. **No global state library** — Both frontends use local component state. AsyncStorage/localStorage for persistence only.

---

## Color Palette (Mobile)

| Usage      | Color     |
| ---------- | --------- |
| Primary    | `#111A50` (navy) |
| Background | `#f8f9fa` |
| Cards      | `#ffffff` |
| Accent     | `#4A90D9` |
| Text       | `#333333` |
| Muted text | `#666666` |

---

## Adding New Features

### New API Endpoint
1. Create or update the route file in `server/src/routes/`
2. Create the controller method in `server/src/controllers/`
3. Create the service method in `server/src/services/`
4. Add middleware as needed (auth, admin)
5. Register the route in `server/src/app.js` if it's a new route file

### New Web Page
1. Create the page component in `web/src/pages/`
2. Add the route in `web/src/App.jsx`
3. Add API functions in `web/src/services/api.js` if needed

### New Mobile Screen
1. Create the screen file in the appropriate `client/app/` subdirectory
2. expo-router auto-registers it based on file location
3. Update `_layout.jsx` if new navigation structure is needed

### New Reusable Component
- Web: `web/src/component/`
- Mobile: `client/app/components/`
