# Feras Company Medical Portal — React Version

Same portal, same Supabase backend, rebuilt with React + Vite + React Router.
Every page from the vanilla version has an equivalent here:

| Vanilla page      | React route |
|--------------------|-------------|
| (new) public homepage | `/`     |
| auth.html           | `/auth`     |
| (new) forgot password | `/forgot-password` |
| (new) reset password  | `/reset-password` |
| index.html          | `/dashboard` |
| form.html            | `/intake` (also handles `?id=` for editing an existing record) |
| appointment.html    | `/book`     |
| (new) 404            | any unmatched path |

Same features carried over: EN/AR language toggle with RTL, dark/light theme,
role-based dashboard (admin/patient), Our Doctors & Our Hospitals management,
appointment booking with hospital → doctor cascading select, admin appointment
status management, and the Chatbase widget.

**New in this round:**
- Public landing page (browsable without logging in) with the overview,
  Our Hospitals, and Our Doctors sections
- Forgot/reset password flow
- Patients can cancel their own appointments and edit their own submitted
  records (`/intake?id=<recordId>`)
- Admin: search/filter on patients and appointments, plus two charts
  (appointments per week, patients by blood type)
- Doctors/Hospitals: photo URL field, search by name/specialty, and CSV
  bulk import for doctors (columns: `name,department,specialty,bio,photo_url,hospital`)
- Toast notifications for save/delete/status-change actions
- A proper 404 page and a lightweight loading skeleton

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/hosp-react/` (the `/hosp-react/` base path matches your
GitHub Pages URL — see `vite.config.js` if you ever move the repo).

Supabase credentials are already filled in `src/lib/supabaseClient.js`.

## Deploying to GitHub Pages

This project ships with a one-command deploy using the `gh-pages` package,
which builds the app and pushes the output to a `gh-pages` branch.

```bash
npm run deploy
```

Then, one-time only: in your `hosp-react` repo → **Settings → Pages**, set the
source branch to `gh-pages` (instead of `main`). After that, every
`npm run deploy` updates the live site.

**Important:** this replaces how the site is served — your old vanilla
`.html`/`.js`/`.css` files can stay on `main` for reference, but Pages will
now serve from the `gh-pages` branch instead. If you'd rather keep serving
from `main` directly, you can instead run `npm run build`, then manually
copy everything from the generated `dist/` folder into your repo root and
commit/push as usual — just make sure to remove the old `auth.html`,
`index.html`, etc. first so nothing conflicts.

## Project structure

```
src/
  lib/
    supabaseClient.js   Supabase client + getUserRole()
    i18n.js             EN/AR dictionary (ported from i18n.js)
  context/
    AuthContext.jsx      session + role, via Supabase auth state
    ThemeContext.jsx      dark/light, persisted to localStorage
    LangContext.jsx        EN/AR, persisted to localStorage, sets dir=rtl
    ToastContext.jsx       save/delete/status-change notifications
  components/
    Nav.jsx, Logo.jsx, VitalLine.jsx, ProtectedRoute.jsx
    OverviewPanel.jsx      "About this portal" section
    HospitalsSection.jsx   Our Hospitals (admin CRUD, photo, search)
    DoctorsSection.jsx     Our Doctors (admin CRUD, photo, search, CSV import)
    AdminView.jsx           stats, charts, search/filter, appointment management
    PatientView.jsx        overview stats, my records (editable), my appointments (cancelable)
  pages/
    Landing.jsx             public homepage
    AuthPage.jsx, ForgotPassword.jsx, ResetPassword.jsx
    Dashboard.jsx, IntakeForm.jsx, AppointmentForm.jsx
    NotFound.jsx            404 page
  App.jsx    routes (HashRouter — required for GitHub Pages static hosting)
  styles.css  full design system, ported + consolidated from the vanilla version
```

## CSV import format (Our Doctors)

Header row required, columns: `name,department,specialty,bio,photo_url,hospital`
— `hospital` should match an existing hospital's name exactly (case-insensitive)
or the row imports with no hospital assigned.

## Notes

- Uses `HashRouter` (URLs look like `/hosp-react/#/book`) instead of `BrowserRouter`
  because GitHub Pages has no server-side rewrite rule — a real path like
  `/hosp-react/book` would 404 on refresh. Hash routes always resolve to
  `index.html` first, then React Router takes over.
- The Supabase `user_roles` row is created server-side by the Postgres
  trigger you already set up (`handle_new_user`) — no client-side insert
  needed on signup, same as the vanilla version's final fix.
- RLS policies are unchanged — same `patients`, `user_roles`, `appointments`,
  `doctors`, `hospitals` tables and policies you already created.
