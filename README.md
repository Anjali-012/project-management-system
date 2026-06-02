# Internal Project Management System

A real-time project management tool built with the MERN stack. Multiple users working on the same project see task changes instantly — no refresh needed.

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

---

## Functional Requirements

### Core Features
- Register and log in with JWT authentication.
- Create projects; only members can see a project.
- Project creators and admins can add members by email.
- Members can create, view, update, and move tasks between **Todo**, **In Progress**, and **Done**.
- All users viewing the same project receive task events in real time.
- Activity log records every task change; notifications are created on member addition and task assignment.

### Roles & Permissions
- `member` — access and manage tasks in projects they belong to.
- `admin` — add members to any project, delete any task.
- Project creator — add members to their own project.

### Assumptions
- Teams are internal; project membership is the primary auth boundary.
- A task may only be assigned to a current project member.
- Redis is optional locally but required for multi-instance production deployments.

### Out of Scope
- File attachments, comments, mentions, sprint planning, email delivery, billing.
- Full drag-and-drop (status changes use controlled selects; column drag-to-drop is supported).

---

## Database Schema

**users** — `name`, `email`, `passwordHash`, `role`

**projects** — `title`, `description`, `createdBy` → User, `members` → [User]

**tasks** — `title`, `description`, `status`, `project` → Project, `assignedTo` → User, `createdBy` → User, `isDeleted`, `deletedAt`

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
| PATCH | `/api/tasks/:id` | JWT, member | Update title, description, assignee, or status |
| DELETE | `/api/tasks/:id` | JWT, creator/admin | Soft-delete a task |
| GET | `/api/activity/:projectId` | JWT, member | List project activity |
| GET | `/api/notifications` | JWT | List notifications for the current user |
| GET | `/health` | Public | Health check |

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
├── utils/           # ApiError, asyncHandler, logActivity, createNotification
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
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Required `.env` variables:

```
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

---

## Deployment Steps

### Backend (VM — DigitalOcean / Hetzner / Vultr)

```bash
# 1. Provision Ubuntu VM, point subdomain A record to VM IP

# 2. Install dependencies
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2

# 3. Clone repo, install, configure
git clone <repo-url> && cd <repo>/backend
cp .env.example .env   # set MONGO_URI, JWT_SECRET, CLIENT_URL, REDIS_URL
npm ci

# 4. Start with PM2
pm2 start src/server.js --name pms-backend
pm2 save && pm2 startup

# 5. Nginx reverse proxy  (/etc/nginx/sites-available/pms-api)
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# 6. Enable SSL
sudo certbot --nginx -d api.yourdomain.com
```

### Frontend (Netlify / Vercel)

```bash
cd frontend
npm run build          # outputs to dist/
```

Deploy `dist/` to Netlify or Vercel with these environment variables set in the dashboard:

```
VITE_API_URL=https://api.yourdomain.com
VITE_SOCKET_URL=https://api.yourdomain.com
```

### CI/CD (GitHub Actions)

The pipeline runs on every push to `main`:

1. **Lint** — `eslint .` on the frontend.
2. **Build** — `tsc -b && vite build` to catch type errors.
3. **Backend check** — `npm ci` to verify the dependency tree.
4. **Deploy** — SSH into the VM, pull latest, `npm ci`, restart PM2 (backend); trigger Netlify/Vercel deploy hook (frontend).

Branching strategy: feature branches → PR → `main`. Direct pushes to `main` are blocked. The CI gate must pass before merge.

---

## URLs

- Frontend: _add deployed URL here_
- Backend: _add deployed URL here_
- Planning & Design doc: [`docs/planning-and-design.md`](docs/planning-and-design.md)
- Loom video: _add video URL here_

---

## AI Usage Declaration

AI tooling was used during development for code generation, refactoring suggestions, and documentation drafting. Every generated piece of code has been read, understood, and verified against the application requirements. Any code that could not be explained line-by-line was rewritten manually.
