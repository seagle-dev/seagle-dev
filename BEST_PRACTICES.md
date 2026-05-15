# Seagle Best Practices (Compressed)

## 1. Naming
- **PascalCase:** React Components, Pages.
- **camelCase:** Variables, Functions, Exports.
- **snake_case:** DB columns, matching schema props.
- **kebab/dot.notation:** Filenames (`auth.controller.js`).

## 2. Mobile (Expo 54, RN 0.81)
- **Structure:** `app/components/` (shared), `app/tabs/` (screens).
- **Navigation:** `expo-router` file-based. Pass IDs. `JSON.stringify` with care.
- **Fetch:** `try/catch/finally` for loading/error. Avoid logic-heavy `useEffect`.
- **Styles:** `StyleSheet.create()`. Use `constants/theme.js`. `SafeAreaView` mandatory.

## 3. Web (React 19, Vite 7)
- **Pages:** Data fetching, high-level layout.
- **Components:** Presentational, reusable.
- **State:** Local `useState`. Context for Auth only.
- **API:** Centralize in `services/api.js`. Use Axios interceptors.

## 4. Backend (Express 5, MySQL)
- **Flow:** `Route -> Controller -> Service -> Model`.
- **Errors:** `asyncHandler` wrapper mandatory. Consistent JSON: `{ data: ... }` or `{ message: ... }`.
- **Validation:** Controller-level check of `req.body` and `req.params`.
- **Security:** `verifyToken` middleware. Parameterized SQL only. `process.env` for secrets.
- **Storage:** **Supabase** for files. **Firebase** for Auth. Stream large files.

## 5. Validation
- Test with Postman/Insomnia. Verify UI on varied screen sizes. High-signal logging only.
