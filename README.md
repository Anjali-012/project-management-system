# Internal Project Management System

A MERN project management tool with JWT auth, project/member management, task boards, and Socket.IO powered task updates for users viewing the same project.

## Architecture Overview

React + Vite talks to the Express API over REST for auth, projects, and initial task data. After login, the frontend opens an authenticated Socket.IO connection and joins a `project:{projectId}` room for the selected project. Task create/update/delete APIs persist data in MongoDB, log activity, create notifications where needed, then emit task events to the project room.

MongoDB stores users, projects, tasks, notifications, and activity records. Redis is optional locally, but supported through `REDIS_URL` for the Socket.IO Redis adapter in scaled deployments.

## Design Decisions

- Context-level React state was kept inside `App.tsx` because this task has a small shared state surface: auth, selected project, projects, tasks, and socket connection.
- REST remains the source of truth for writes; sockets broadcast committed changes only after MongoDB succeeds.
- Socket auth uses the same JWT as HTTP auth so project membership checks are consistent.
- Soft delete is used for tasks to preserve activity history.

## API List

- `POST /api/auth/register` creates a user.
- `POST /api/auth/login` returns a JWT and user profile.
- `GET /api/projects` lists projects for the logged-in user.
- `POST /api/projects` creates a project and adds the creator as a member.
- `POST /api/projects/:projectId/members` adds a member by email.
- `GET /api/tasks?projectId=:id` lists tasks for a project.
- `POST /api/tasks` creates a task.
- `PATCH /api/tasks/:id` updates title, description, assignment, or status.
- `DELETE /api/tasks/:id` soft deletes a task.
- `GET /api/activity/:projectId` lists project activity.
- `GET /api/notifications` lists current user notifications.

## Socket Events

- Client emits `project:join` with `projectId`.
- Client emits `project:leave` with `projectId`.
- Server emits `task:created` with the task.
- Server emits `task:updated` with the task.
- Server emits `task:deleted` with `{ id, project }`.

## Local Setup

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Required backend env:

```bash
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/internal-pms
JWT_SECRET=replace-me
CLIENT_URL=http://localhost:5173
REDIS_URL=
```

Frontend env:

```bash
VITE_API_URL=http://localhost:5001
VITE_SOCKET_URL=http://localhost:5001
```

## Deployment Steps

Backend VM flow: install Node, PM2, Nginx, and Certbot; configure `.env`; run `npm ci`; start with PM2; proxy the API domain to `localhost:5001`; enable SSL with Let’s Encrypt.

Frontend flow: deploy `frontend/dist` to Netlify/Vercel after `npm run build`, with `VITE_API_URL` and `VITE_SOCKET_URL` pointing to the deployed backend URL.

GitHub Actions should run lint and build for frontend, install backend dependencies, and deploy from the main branch after checks pass.

## URLs

- Frontend: add deployed URL here.
- Backend: add deployed URL here.
- Loom: add video URL here.
