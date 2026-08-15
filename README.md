# Task Management System

An internal task and project management dashboard built for the Webvory full-stack assignment. It preserves a production-style project workspace: authenticated users collaborate on projects, manage tasks, track activity, receive notifications, and see live changes without a refresh.

---

## Architecture Overview

```
React + Vite (TypeScript)
        │
        │  REST (JWT)        WebSocket (Socket.IO + JWT)
        ▼                              ▼
   Express API  ◄────────────  Project Rooms
        │
        ▼
     MongoDB
        │
   Redis Adapter
   (optional, for horizontal scaling)
```

- The frontend talks to the backend over REST for all writes and initial data loads.
- After login, the frontend opens an authenticated Socket.IO connection and joins a `project:{projectId}` room for the active project.
- Task create / update / delete API handlers persist to MongoDB first, then emit the socket event. Clients merge the incoming event into local state — no re-fetch needed.
- Redis is wired in via `REDIS_URL` so multiple backend instances share socket events. It is optional for local development.

---

## Design Decisions & Trade-offs

| Decision | Reason |
|---|---|
| REST as source of truth for writes | Keeps validation, auth, and persistence in one place. Sockets only broadcast what already succeeded. |
| Context-level state in `App.tsx` | The shared surface is small (auth, selected project, tasks, socket). A dedicated library adds indirection without benefit at this scale. |
| Socket auth via the same JWT | Project membership checks are identical for HTTP and socket handlers — one token, one rule. |
| Soft delete for tasks | Preserves the activity log. `isDeleted` filter is applied at query time. |
| Redis adapter opt-in | Works out of the box locally; flips on automatically in production when `REDIS_URL` is set. |
| `useWorkspace` hook | Keeps all workspace state and side-effects in one place, leaving `App.tsx` as a pure composition root. |
| Email via Nodemailer, opt-in | `notifyUser` is the single dispatch point for all user-facing events — it sends an in-app notification and delegates to `emailService`, which is fire-and-forget. Failures are structured-logged (`EMAIL_FAILED`) and never propagate to the API caller. If `SMTP_HOST` is unset, the email layer exits immediately — no code change needed to enable it post-deploy. |
| Transport layer isolated from email logic | Nodemailer lives only in `utils/email/transport.js`. Swapping to SES or SendGrid means replacing that one file — `emailService`, `templates`, and `notifyUser` are untouched. |
| Typed email templates, content separate from logic | `utils/email/templates.js` owns subjects, HTML, and plain-text per event type. Adding a new email event is a single key addition there — no changes to send logic. |

---

## Functional Requirements

### Core Features
- Register and log in with JWT authentication.
- Create projects; only members can see a project.
- Project creators and admins can add members by email.
- Members can create, view, update, and move tasks between **Todo**, **In Progress**, and **Done**.
- All users viewing the same project receive task events in real time.
- Activity log records every task change; notifications are created on member addition and task assignment.
- Assigned user receives an email notification when a task is created or re-assigned to them.
- Task list supports database-backed search, status/priority/assignee filters, safe sorting, and pagination.
- Dashboard provides total, pending, in-progress, completed, overdue, and current-user task counts from live data.
- Task details load from the API and include metadata, comments, and edit access.
- Tasks support Pending, In Progress, Blocked, and Completed assignment-facing statuses while retaining compatible stored values for existing records.
- External Directory proxies and caches JSONPlaceholder users through the backend with a timeout.

### Roles & Permissions
- `member` — access and manage tasks in projects they belong to.
- `admin` — add members to any project, delete any task.
- Project creator — add members to their own project.

### Assumptions
- Teams are internal; project membership is the primary auth boundary.
- A task may only be assigned to a current project member.
- Redis is optional locally but required for multi-instance production deployments.

### Out of Scope
- File attachments, mentions, sprint planning, billing.
- Email delivery for events other than task assignment (member-added emails, status-change emails, etc.).
- Full drag-and-drop (status changes use controlled selects; column drag-to-drop is supported).

---

## Database Schema

**users** — `name`, `email`, `passwordHash`, `role`

**projects** — `title`, `description`, `createdBy` → User, `members` → [User]

**tasks** — `title`, `description`, `status`, `priority`, `dueDate`, `project` → Project, `assignedTo` → User, `createdBy` → User, embedded `comments`, `isDeleted`, `deletedAt`

**activities** — `project` → Project, `user` → User, `action`, `metadata`

**notifications** — `user` → User, `message`, `type`, `isRead`

---

## API List

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a user account |
| POST | `/api/auth/login` | Public | Return JWT + user profile |
| GET | `/api/projects` | JWT | List projects for the logged-in user |
| POST | `/api/projects` | JWT | Create a project; creator added as first member |
| POST | `/api/projects/:projectId/members` | JWT, creator/admin | Add a member by email |
| GET | `/api/tasks?projectId=:id` | JWT, member | List tasks for a project |
| POST | `/api/tasks` | JWT, member | Create a task |
| GET | `/api/tasks/:id` | JWT, member | Load a task's detail, including comments |
| PUT/PATCH | `/api/tasks/:id` | JWT, member | Update title, description, priority, due date, assignee, or status |
| DELETE | `/api/tasks/:id` | JWT, creator/admin | Soft-delete a task |
| GET | `/api/tasks/:id/comments` | JWT, member | List a task's comments |
| POST | `/api/tasks/:id/comments` | JWT, member | Add a comment |
| GET | `/api/users` | JWT | List users in the caller's accessible workspace |
| POST | `/api/users` | JWT, admin | Provision a user through the existing auth service |
| GET | `/api/dashboard` | JWT | Task statistics, recent tasks, and activity for accessible projects |
| GET | `/api/external/users` | JWT | Cached, processed JSONPlaceholder directory users |
| GET | `/api/activity/:projectId` | JWT, member | List project activity |
| GET | `/api/notifications` | JWT | List notifications for the current user |
| GET | `/health` | Public | Health check |

### Assignment-facing API details

All task and dashboard endpoints require `Authorization: Bearer <JWT>`. The task list always queries MongoDB; it never fetches the full task set for client-side pagination.

| Method | Endpoint | Query/body | Purpose |
|---|---|---|---|
| GET | `/api/tasks` | `projectId`, `status`, `priority`, `assignee` (or `assignedTo`), `search`, `page`, `limit`, `sortBy`, `sortOrder` | List only tasks the caller can access. `limit` defaults to 20 and is capped at 100. |
| GET | `/api/tasks/:id` | — | Read one authorized task. |
| POST | `/api/tasks` | `title`, `projectId`, optional description/assignee/status/priority/dueDate | Create a task in an authorized project. |
| PUT | `/api/tasks/:id` | Any editable task fields | Update a task. `PATCH` remains supported for existing clients. |
| DELETE | `/api/tasks/:id` | — | Soft-delete an authorized task. |
| GET/POST | `/api/tasks/:id/comments` | POST body: `text` | Read or add task notes. |
| GET | `/api/users` | — | Safe user directory (no password fields). |
| POST | `/api/users` | `name`, `email`, `password`, optional `role` | Admin-only user provisioning that reuses the auth service. Public registration remains `POST /api/auth/register`. |
| GET | `/api/dashboard` | optional `projectId` | Live six-stat dashboard with recent tasks/activity. |
| GET | `/api/external/users` | — | External Directory response from JSONPlaceholder. |

Example task-list response:

```json
{
  "success": true,
  "data": [{ "_id": "…", "title": "Prepare release", "status": "in-progress" }],
  "pagination": { "page": 1, "limit": 20, "total": 57, "totalPages": 3 }
}
```

The established stored statuses are `todo`, `in-progress`, `blocked`, and `done`, displayed as Pending, In Progress, Blocked, and Completed. Existing status values remain compatible. Priorities are `low`, `medium`, `high`, and `urgent`.

### External API integration

`GET /api/external/users` calls `https://jsonplaceholder.typicode.com/users` server-side. The API returns only name, email, company, and city; requests are aborted after five seconds and successful results are cached for five minutes to avoid unnecessary upstream traffic. The Dashboard's **External Directory** renders this response.

---

## Socket Events

| Direction | Event | Payload | Description |
|---|---|---|---|
| Client → Server | `project:join` | `projectId` | Join a project room (membership verified server-side) |
| Client → Server | `project:leave` | `projectId` | Leave a project room |
| Server → Client | `task:created` | `Task` | Broadcast after a task is persisted |
| Server → Client | `task:updated` | `Task` | Broadcast after a task update is persisted |
| Server → Client | `task:deleted` | `{ id, project }` | Broadcast after a task is soft-deleted |

Socket authentication: the JWT is passed in `socket.handshake.auth.token` at connection time. The middleware verifies it before any event is processed.

---

## Backend Folder Structure

```
backend/src/
├── config/          # DB and Redis connection
├── controllers/     # Request handlers (thin — delegate to services)
├── services/        # Business logic (auth, projects, tasks)
├── routes/          # Express routers
├── models/          # Mongoose schemas
├── sockets/         # Socket.IO init + room/event logic
├── middlewares/     # auth, error, project-member, task-member, validation
├── validations/     # express-validator rule sets
├── utils/           # ApiError, asyncHandler, logActivity, createNotification, notifyUser
│   └── email/       # transport, templates, emailService
├── app.js           # Express app setup
└── server.js        # HTTP server + DB + socket init
```

---

## Local Setup

**Backend**

```bash
cd backend
cp .env.example .env   # fill in values below
npm install
npm run dev
```

Required `.env` variables:

```
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/internal-pms
JWT_SECRET=replace-me
CLIENT_URL=http://localhost:5173
REDIS_URL=                         # leave blank to skip Redis locally

# Email — leave blank to disable task-assignment emails
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

`MONGO_URI` is deliberately retained instead of migrating to PostgreSQL/SQLite: this mature application already uses MongoDB/Mongoose relationships and authorization queries. Keeping it protects the existing architecture while still providing real persistence, validation, and database-side task filtering.

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Tailwind CSS is configured through the official `@tailwindcss/vite` plugin and is used incrementally in assignment-facing dashboard, task board/card, task controls, and task-detail UI. Existing CSS Modules remain in place to preserve the established visual system.

Required `.env` variables:

```
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

---

## Deployment Steps

### Backend (Render)

1. Push code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com), connect the repo, set root directory to `backend`.
3. Set build command `npm ci` and start command `node src/server.js`.
4. Add environment variables in the Render dashboard:

```
MONGO_URI=<your Atlas URI>
JWT_SECRET=<secret>
CLIENT_URL=https://<your-vercel-app>.vercel.app
REDIS_URL=<your Redis Cloud URL>
SMTP_HOST=smtp.gmail.com          # or any SMTP provider
SMTP_PORT=587
SMTP_USER=<your email address>
SMTP_PASS=<app password / SMTP credential>
```

5. Copy the **Deploy Hook URL** from Render → Settings → Deploy Hook. Add it as `RENDER_DEPLOY_HOOK_URL` in GitHub repository secrets.

### Frontend (Vercel)

1. Import the GitHub repo in [Vercel](https://vercel.com), set root directory to `frontend`.
2. Vercel auto-detects Vite — no build command changes needed.
3. Add environment variables in the Vercel dashboard:

```
VITE_API_URL=https://<your-render-service>.onrender.com
VITE_SOCKET_URL=https://<your-render-service>.onrender.com
```

4. Go to Vercel → Settings → Git → Deploy Hooks, create a hook, and add it as `VERCEL_DEPLOY_HOOK_URL` in GitHub repository secrets.

### Redis (Redis Cloud — free tier)

1. Sign up at [redis.io/try-free](https://redis.io/try-free) — no credit card needed.
2. Create a free database, copy the `redis://...` connection string.
3. Set it as `REDIS_URL` in Render environment variables.

With `REDIS_URL` set, the Socket.IO Redis adapter activates automatically — no code changes needed.

### CI/CD (GitHub Actions — `.github/workflows/ci.yml`)

The pipeline runs on every push and PR to `main`:

1. **Frontend lint** — `eslint .`
2. **Frontend build** — `tsc -b && vite build` (catches type errors)
3. **Backend install check** — `npm ci` (validates the dependency tree)
4. **Deploy** — on merge to `main`, hits the Render deploy hook (backend) and Vercel deploy hook (frontend) via `curl`.

Branching strategy: feature branches → PR → `main`. Direct pushes to `main` are blocked. The CI gate must pass before merge.

---

## URLs

- Frontend: _add deployed URL here_
- Backend: _add deployed URL here_
- Planning & Design doc: [`docs/FRD.md`](docs/FRD.md)
- Loom video: _add video URL here_

---

## AI Usage Declaration

AI tooling was used during development for code generation, refactoring suggestions, and documentation drafting. Every generated piece of code has been read, understood, and verified against the application requirements. Any code that could not be explained line-by-line was rewritten manually.
