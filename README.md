# Task Management System

Webvory's task and project management assignment, built with React, Vite, TypeScript, Node.js, Express, PostgreSQL, Socket.IO, and optional Redis-backed socket scaling.

## Architecture

The React/Vite frontend calls the Express REST API with JWT authentication. PostgreSQL is the source of truth for users, projects, memberships, tasks, comments, activity, and notifications. Socket.IO broadcasts successfully persisted task changes to each project room.

## PostgreSQL setup

PostgreSQL 18 (or a compatible version) must be running with a database named `webvory_task_management`.

```bash
createdb webvory_task_management
cd backend
cp .env.example .env
# set DATABASE_URL and JWT_SECRET in .env
npm install
npm run migrate:up
npm run dev
```

`DATABASE_URL` uses this form; do not put a real password in source control:

```env
DATABASE_URL=postgresql://postgres:<PASSWORD>@localhost:5432/webvory_task_management
```

Rollback the latest migration with `npm run migrate:down`.

The schema contains `users`, `projects`, `project_members`, `tasks`, `comments`, `activities`, and `notifications`. UUID primary keys and foreign keys preserve project ownership and membership relationships. Task indexes cover project visibility, status, priority, assignee, due date, and ordering dates.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Configure `VITE_API_URL=http://localhost:5001` and `VITE_SOCKET_URL=http://localhost:5001` if defaults do not suit your setup.

## API

All `/api` endpoints other than register/login require `Authorization: Bearer <JWT>`.

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET, POST /api/projects`; project member management under `/api/projects/:projectId/members`
- `GET, POST /api/tasks`; `GET, PUT, PATCH, DELETE /api/tasks/:id`
- `GET, POST /api/tasks/:id/comments`; `GET /api/tasks/:id/activity`
- `GET /api/dashboard`, `GET /api/users`, `POST /api/users` (admin)
- `GET /api/activity`, `GET /api/notifications`, `PATCH /api/notifications/read-all`
- `GET /api/external/users` (timeout-protected cached JSONPlaceholder proxy)

Task listing is database-backed. It accepts `projectId`, `status`, `priority`, `assignee`/`assignedTo`, `search`, `page`, `limit`, `sortBy`, and `sortOrder`. For example:

```text
/api/tasks?projectId=<uuid>&status=in-progress&search=shopify&page=1&limit=20
```

Responses include `pagination: { page, limit, total, totalPages }`. Stored status values are `todo`, `in-progress`, `blocked`, and `done`, which map to Pending, In Progress, Blocked, and Completed. Priorities are `low`, `medium`, `high`, and `urgent`.

## Assumptions

- Project membership is the authorization boundary; global admins retain their existing override.
- Task assignees must be eligible project members.
- Redis and SMTP are optional locally. Socket.IO and email notification behavior remain intact when configured.
