# StatusDesk Frontend

The StatusDesk web client pairs an incident-response workspace with a public
status page. It is built with React 19, TypeScript, Vite, React Router, and
Socket.IO.

## Pages

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Find a status page by organization name or slug |
| `/status/:slug` | Public | Live service health, active incidents, and incident history |
| `/register` | Signed out | Create an organization and an admin account |
| `/login` | Signed out | Sign in to an existing workspace |
| `/forgot-password` | Public | Request a password reset link by email |
| `/reset-password` | Public | Choose a new password from an emailed reset link |
| `/accept-invite` | Public | Join a workspace from an invitation link |
| `/dashboard` | Signed in | Incident overview, filters, services, and response actions |
| `/incidents/:id` | Signed in | Timeline, status transitions, responder assignments, updates, and postmortems |
| `/team` | Signed in | Workspace directory and pending invitations |

Admins and responders can manage incidents, assign or unassign responders, and
edit draft postmortems. Only admins can add services, change service state
through incident resolution, publish postmortems, and invite or revoke
teammates. Viewers have read-only access. All signed-in members can view the
team directory.

## Local development

Run the backend API on `http://localhost:5000`, then:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and
`/socket.io` to the backend, so session cookies stay on the same origin.

Set the backend's `CLIENT_URL` to `http://localhost:5173` so generated invite
and password-reset links point at this app's `/accept-invite` and
`/reset-password` routes. Configure `SMTP_*` on the backend to send invitation
and reset emails; when email is unavailable, the team page still shows the
one-time invitation link for copying.

If the API or Socket.IO server lives elsewhere, create a `.env` file from
`.env.example` and set `VITE_API_URL` and optionally `VITE_SOCKET_URL`.
Requests use `credentials: "include"`.

## Scripts

```bash
npm run dev      # Vite dev server with HMR
npm run build    # Type-check and create a production build in dist/
npm run preview  # Serve the production build on port 4173
npm run lint     # ESLint
```

The preview server uses the same proxy configuration as development.

## Live updates

The dashboard and public status page subscribe to the backend Socket.IO
namespace (`/` and `/public`, respectively). When the socket is unavailable,
the client falls back to polling. The public page also shows whether it is
receiving live updates or polling.

## Accessibility

- Every route has a document title, a single page heading, and a skip link that
  moves focus to the main content.
- Forms use explicit labels, describe errors inline, move focus to the first
  invalid field, and announce errors with a live region.
- Dialogs lock background scrolling, focus the first field, and return focus
  when closed.
- Focus-visible styles, semantic status colors, and reduced-motion fallbacks are
  included throughout.

## Project structure

```text
src/
  auth/         session context and route guards
  components/   forms, dialogs, badges, timeline, postmortem, feedback
  hooks/        workspace data, public status, socket subscriptions, titles
  pages/        home, public status, auth, dashboard, incident, team, 404
  styles/       design tokens and page-level styles
  api.ts        fetch wrapper and typed errors
  invitations.ts invitation response normalization
  socket.ts     Socket.IO client factory
  types.ts      API and domain types
```

## Backend contract

The client uses the existing multi-tenant REST API for organizations,
services, incidents, timeline updates, and postmortems. The session endpoints
`GET /api/v1/auth/me` and `POST /api/v1/auth/logout`, the password-reset
endpoints `POST /api/v1/auth/forgot-password` and
`POST /api/v1/auth/reset-password`, and the incident timeline endpoint
`GET /api/v1/incidents/:id/updates`, are required for session hydration,
sign-out, password recovery, and incident detail views.

Responder assignment uses `GET /api/v1/incidents/:id/assignees` (the
organization's assignable members), `POST /api/v1/incidents/:id/assign`, and
`DELETE /api/v1/incidents/:id/assign/:userId`. Draft postmortems are saved with
`PATCH /api/v1/incidents/:id/postmortem`.

Team management uses `GET /api/v1/members` for the workspace directory and
`GET /api/v1/invitations` for pending invitations. Admins create invitations
with `POST /api/v1/invitations`, resend them with
`POST /api/v1/invitations/:id/resend`, revoke them with
`DELETE /api/v1/invitations/:id`, and invitees join through
`POST /api/v1/invitations/accept`. Create and resend responses include the
one-time invite link plus an `emailSent`/`email_sent` flag; the app shows the
link for copying when email delivery is unavailable.
