# Functional Requirements Document (FRD)
## Internal Project Management System

**Version:** 1.0
**Stack:** Node.js · Express · MongoDB · Socket.IO · Redis · React (Vite + TypeScript)

---

## Table of Contents

1. [Core Features](#1-core-features)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Task Lifecycle](#3-task-lifecycle)
4. [Assumptions](#4-assumptions)
5. [Out of Scope](#5-out-of-scope)
6. [System Design](#6-system-design)
   - 6.1 [High-Level Architecture](#61-high-level-architecture)
   - 6.2 [API List](#62-api-list)
   - 6.3 [Database Schema](#63-database-schema)
   - 6.4 [Real-Time Communication Strategy](#64-real-time-communication-strategy)
   - 6.5 [Design Decisions & Why](#65-design-decisions--why)
   - 6.6 [Scalability Considerations](#66-scalability-considerations)

---

## 1. Core Features

| # | Feature | Description |
|---|---|---|
| F-1 | **User Registration & Login** | Users register with a name, email, and password. Login returns a signed JWT (7-day expiry) that is used to authenticate all subsequent REST and WebSocket requests. |
| F-2 | **Project Management** | Any authenticated user can create a project. Each user can only see projects they are a member of. The creator is automatically added as the first member on creation. |
| F-3 | **Member Management** | A project creator or a global admin can add any registered user to a project by their email address. Added users gain immediate access to the project and receive an in-app notification. |
| F-4 | **Task Management** | Project members can create tasks, view all tasks for a project, edit task details (title, description, assignee, status), and soft-delete tasks. Deleted tasks are hidden from all views but kept in the database for audit purposes. |
| F-5 | **Real-Time Task Updates** | All users currently viewing the same project see task create, update, and delete events pushed instantly via Socket.IO — no manual refresh is needed. |
| F-6 | **Activity Log** | Every task action (created, updated, status changed, deleted) and every member addition is automatically logged per project. All project members can view the activity timeline. |
| F-7 | **In-App Notifications** | A notification is created for a user when they are added to a project, or when a task is assigned to them. Notifications are fetched from the server and displayed in the UI. |

---

## 2. User Roles & Permissions

There are two system-level roles: **`member`** (default) and **`admin`**. Role is stored on the user record and is set at registration. There is no API to self-promote — `admin` must be assigned directly in the database.

In addition to system roles, a **Project Creator** has elevated permissions on the specific project they created.

| Permission | `member` | `admin` | Project Creator |
|---|:---:|:---:|:---:|
| Register & log in | ✅ | ✅ | ✅ |
| View own projects | ✅ | ✅ | ✅ |
| Create a new project | ✅ | ✅ | ✅ |
| Add member to their **own** project | ❌ | ✅ | ✅ |
| Add member to **any** project | ❌ | ✅ | ❌ |
| Create a task in a joined project | ✅ | ✅ | ✅ |
| Edit any task in a joined project | ✅ | ✅ | ✅ |
| Delete their **own** task | ✅ | ✅ | ✅ |
| Delete **any** task in a project | ❌ | ✅ | ❌ |
| View project activity log | ✅ | ✅ | ✅ |
| View own notifications | ✅ | ✅ | ✅ |

> Permission checks are enforced at the service layer (`project.service.js`, `task.service.js`) and through dedicated middleware (`projectMember.middleware.js`, `taskMember.middleware.js`). A member who is not part of a project cannot access its tasks or activity at all.

---

## 3. Task Lifecycle

Tasks have three statuses: **Todo**, **In Progress**, and **Done**.

```
  ┌────────┐      ┌─────────────┐      ┌──────┐
  │  Todo  │ ───► │ In Progress │ ───► │ Done │
  └────────┘      └─────────────┘      └──────┘
      ▲                  ▲                 ▲
      └──────────────────┴─────────────────┘
               (any direction allowed)
```

- Status can move freely in any direction — there is no enforced linear progression.
- Status changes are made via `PATCH /api/tasks/:id`.
- The UI provides both a **dropdown select per card** and **drag-and-drop between columns**.
- Every status change is recorded in the activity log with the previous (`from`) and new (`to`) status values.
- **Soft Delete:** Deleting a task sets `isDeleted: true` and records `deletedAt`. The task is permanently excluded from all queries via the `isDeleted: false` filter but remains in the database for the activity log.

---

## 4. Assumptions

1. The system is **internal** — users must register themselves; there is no admin-managed user provisioning flow.
2. **Task assignment** is restricted to current project members only. Assigning a non-member returns an HTTP 400 error.
3. A **single JWT** (same secret, same payload) is used for both REST API calls (`Authorization: Bearer <token>`) and Socket.IO connections (`handshake.auth.token`).
4. **Redis is optional locally.** The Socket.IO Redis pub/sub adapter activates automatically when the `REDIS_URL` environment variable is set. Without it, the app runs on a single instance.
5. Tasks are loaded in batches of up to 100 per project load. Server-side pagination query params (`page`, `limit`, `sortBy`, `order`, `status`, `search`) are available for future use.
6. The activity panel and notification panel in the UI show the **8 most recent entries** each to keep the interface concise. The full history is available via the API.
7. There is no password reset, email verification, or token refresh flow. JWT expiry is 7 days.

---

## 5. Out of Scope

The following features were explicitly excluded from this version:

- File or image attachments on tasks or projects.
- Inline comments or @-mention threads on tasks.
- Sprint planning, milestones, story points, or time tracking.
- Email delivery for notifications — notifications are in-app only.
- Admin UI for user management (role promotion, account deactivation).
- Full drag-and-drop column reordering (column order is fixed: Todo → In Progress → Done).
- Billing, usage quotas, or multi-tenancy.

---

---

## 6. System Design

### 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                         │
│                                                             │
│   React + Vite (TypeScript)                                 │
│   ┌────────────┐  ┌──────────────────────────────────────┐  │
│   │  useAuth   │  │            useWorkspace              │  │
│   │  (JWT,     │  │  ┌─────────────┐  ┌───────────────┐  │  │
│   │   forms)   │  │  │ REST calls  │  │  Socket.IO    │  │  │
│   └────────────┘  │  │ via client  │  │  (JWT auth)   │  │  │
│                   │  └──────┬──────┘  └──────┬────────┘  │  │
│                   └─────────┼────────────────┼───────────┘  │
└─────────────────────────────┼────────────────┼─────────────┘
                    HTTPS     │                │ WSS
                              ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (Reverse Proxy)                     │
│              SSL termination via Let's Encrypt              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js + Express Backend                     │
│                                                             │
│  app.js ──► Routes ──► Middlewares ──► Controllers          │
│                                              │              │
│                                          Services           │
│                                              │              │
│                                    ┌─────────┴──────────┐   │
│                                    │      MongoDB       │   │
│                                    │ (users, projects,  │   │
│                                    │  tasks, activity,  │   │
│                                    │  notifications)    │   │
│                                    └────────────────────┘   │
│                                                             │
│  Socket.IO Server                                           │
│    ├─ JWT auth middleware (verifies token on connect)       │
│    ├─ project:join  (verifies membership, adds to room)     │
│    ├─ project:leave (removes from room)                     │
│    └─ emitToProject() ◄──── called after every task write   │
│              │                                              │
│       Redis Adapter (optional)                              │
│  (pub/sub — syncs events across multiple instances)         │
└─────────────────────────────────────────────────────────────┘
              │                         │
              ▼                         ▼
        MongoDB Atlas               Redis Cloud
        (primary store)         (socket event bus)
```

**Request flow in plain terms:**
- All data writes go through REST. The API validates input, checks permissions, writes to MongoDB, then calls `emitToProject()`.
- `emitToProject()` broadcasts the already-persisted payload to every socket in the `project:<id>` room — sockets carry zero business logic.
- A user opening a project for the first time loads current state via REST, then joins the socket room for live updates going forward.

---

### 6.2 API List

| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| GET | `/health` | None | Server health check |
| POST | `/api/auth/register` | None | Create a new user account |
| POST | `/api/auth/login` | None | Authenticate and receive JWT + user profile |
| GET | `/api/projects` | JWT | List all projects the current user is a member of |
| POST | `/api/projects` | JWT | Create a project; creator is auto-added as first member |
| POST | `/api/projects/:projectId/members` | JWT + creator or admin | Add an existing user to the project by email |
| GET | `/api/tasks` | JWT + project member | List tasks for a project. Query params: `projectId`, `status`, `search`, `page`, `limit`, `sortBy`, `order` |
| POST | `/api/tasks` | JWT + project member | Create a new task in a project |
| PATCH | `/api/tasks/:id` | JWT + project member | Update task title, description, assignee, or status |
| DELETE | `/api/tasks/:id` | JWT + task creator or admin | Soft-delete a task |
| GET | `/api/activity/:projectId` | JWT + project member | Fetch the activity log for a project |
| GET | `/api/notifications` | JWT | Fetch all notifications for the current user |

---

### 6.3 Database Schema

#### Collection: `users`

| Field | Type | Constraints |
|---|---|---|
| `name` | String | Required, trimmed |
| `email` | String | Required, unique, lowercase, trimmed |
| `password` | String | bcrypt hash — plain text never stored |
| `role` | String | Enum: `"member"` (default), `"admin"` |
| `createdAt` / `updatedAt` | Date | Auto-managed by Mongoose timestamps |

---

#### Collection: `projects`

| Field | Type | Constraints |
|---|---|---|
| `title` | String | Required, trimmed |
| `description` | String | Optional |
| `createdBy` | ObjectId → `users` | Required — set on creation |
| `members` | [ ObjectId → `users` ] | Array; creator added automatically |
| `createdAt` / `updatedAt` | Date | Auto-managed |

---

#### Collection: `tasks`

| Field | Type | Constraints |
|---|---|---|
| `title` | String | Required, trimmed |
| `description` | String | Optional |
| `status` | String | Enum: `"todo"` / `"in-progress"` / `"done"`, default `"todo"` |
| `project` | ObjectId → `projects` | Required |
| `assignedTo` | ObjectId → `users` | Optional; must be a current project member |
| `createdBy` | ObjectId → `users` | Required — set on creation |
| `isDeleted` | Boolean | Default `false`; set to `true` on soft delete |
| `deletedAt` | Date | Null by default; populated on soft delete |
| `createdAt` / `updatedAt` | Date | Auto-managed |

---

#### Collection: `activities`

| Field | Type | Constraints |
|---|---|---|
| `project` | ObjectId → `projects` | Required |
| `user` | ObjectId → `users` | The user who performed the action |
| `action` | String | Enum: `TASK_CREATED`, `TASK_UPDATED`, `TASK_STATUS_UPDATED`, `TASK_DELETED`, `MEMBER_ADDED`, `PROJECT_CREATED` |
| `metadata` | Object | Contextual data, e.g. `{ taskId, title, from, to }` |
| `createdAt` | Date | Auto-managed |

---

#### Collection: `notifications`

| Field | Type | Constraints |
|---|---|---|
| `user` | ObjectId → `users` | The recipient |
| `message` | String | Human-readable text |
| `type` | String | Enum: `TASK_ASSIGNED`, `TASK_UPDATED`, `TASK_DELETED`, `PROJECT_MEMBER_ADDED` |
| `isRead` | Boolean | Default `false` |
| `createdAt` | Date | Auto-managed |

---

### 6.4 Real-Time Communication Strategy

#### The Problem
Multiple users viewing the same project need to see task changes made by any other user — immediately, without polling or refreshing.

#### The Solution: Socket.IO Project Rooms

Each project gets a named room: `project:<projectId>`. When a user opens a project, the frontend emits `project:join`. The server verifies membership, then adds the socket to that room. From that point, any event emitted via `io.to("project:<id>").emit(...)` is delivered to all sockets in the room.

#### End-to-End Flow (Task Update Example)

```
User A (browser)
    │
    ├─ PATCH /api/tasks/:id  ──────────────────────► Express route
    │                                                      │
    │                                               auth middleware
    │                                               taskMember middleware
    │                                                      │
    │                                               task.controller.js
    │                                                      │
    │                                               task.service.js
    │                                               (1) writes to MongoDB
    │                                               (2) returns updated task
    │                                                      │
    │                                               emitToProject(projectId,
    │                                                 "task:updated", task)
    │                                                      │
    │                                          io.to("project:<id>").emit(...)
    │                                               /              \
    │◄── HTTP 200 { data: task }            User B socket      User C socket
    │    (origin client updated)            (task:updated)     (task:updated)
    │                                       upsertTask()       upsertTask()
```

#### How User C (late joiner) gets current state

1. User C calls `GET /api/tasks?projectId=<id>` — receives full current task list from MongoDB.
2. Frontend emits `project:join` — socket is added to the room.
3. From this point User C receives all future socket events in real time.

No special catch-up or event replay mechanism is needed. REST is the source of truth for current state; sockets deliver deltas only.

#### Socket Authentication

The JWT is passed in `socket.handshake.auth.token` at connection time. A Socket.IO middleware runs `jwt.verify()` before any event is processed. If the token is missing or invalid, the connection is rejected immediately. Project membership is additionally re-verified on every `project:join` event.

#### Socket Events Reference

| Direction | Event | Payload | When emitted |
|---|---|---|---|
| Client → Server | `project:join` | `projectId: string` | User opens a project |
| Client → Server | `project:leave` | `projectId: string` | User switches away from a project |
| Server → Client | `task:created` | Full populated `Task` object | After `POST /api/tasks` succeeds |
| Server → Client | `task:updated` | Full populated `Task` object | After `PATCH /api/tasks/:id` succeeds |
| Server → Client | `task:deleted` | `{ id: string, project: string }` | After `DELETE /api/tasks/:id` succeeds |

---

### 6.5 Design Decisions & Why

| Decision | Rationale |
|---|---|
| **REST as the source of truth for writes; sockets for broadcast only** | Validation, authorization, and persistence all happen in one place. Sockets carry the already-persisted result — if the socket broadcast fails, no data is lost because the HTTP response already confirmed the write. |
| **React Context + custom hooks instead of Redux or Zustand** | The shared state surface is small: auth, selected project, task list, socket reference. Introducing a dedicated library at this scale adds boilerplate and indirection with no benefit. `useWorkspace` centralises all workspace state and side-effects; `App.tsx` is a pure composition root. |
| **Single JWT for REST and WebSocket** | One secret, one payload shape, one verification path. No second token type or dedicated socket handshake token is needed. Project membership checks for HTTP and socket handlers use identical logic. |
| **Soft delete for tasks** | Deleting a task sets `isDeleted: true` rather than removing the document. This preserves the full activity history and avoids dangling references in the `activities` collection. All task queries filter on `isDeleted: false`. |
| **Redis adapter opt-in via `REDIS_URL`** | The app runs perfectly on a single instance with zero Redis configuration. Setting `REDIS_URL` activates the Socket.IO Redis pub/sub adapter automatically, allowing multiple backend instances to share socket events — no code change required. |
| **Centralised `ApiError` class + error middleware** | All errors thrown anywhere in the application funnel through a single `errorMiddleware` and return a consistent JSON shape (`{ success, message }`). Controllers and services never format error responses directly. |
| **`asyncHandler` wrapper** | Wraps every async route handler so that any thrown error or rejected promise is automatically forwarded to the error middleware — no try/catch boilerplate in controllers. |
| **`express-validator` for input validation** | Rule sets are defined declaratively alongside routes. The shared `validate` middleware runs after the rules and returns all validation errors at once in a consistent format. |

---

### 6.6 Scalability Considerations

| Concern | How it is addressed |
|---|---|
| **Multiple backend instances** | The Socket.IO Redis adapter uses pub/sub so an event emitted on instance A is delivered to clients connected to instance B. Adding instances behind a load balancer requires no code changes. |
| **Database query performance** | Task queries always filter on `project` and `isDeleted`. MongoDB uses a compound index on these fields to avoid full collection scans. The `members` array is queried with direct ObjectId comparison (no full scan). |
| **Large task lists** | `GET /api/tasks` supports `page`, `limit`, `sortBy`, `order`, `status`, and `search` to allow server-side pagination and filtering. The frontend currently requests up to 100 tasks, but the API is ready for stricter limits. |
| **Stateless authentication** | JWT tokens are self-contained. No session store is needed. Any backend instance can verify any token using the shared `JWT_SECRET`. |
| **Frontend performance** | Vite's tree-shaking and code splitting keep the bundle minimal. No global state library is included. Socket state is managed in a single `useRef` per session. |
| **Horizontal scaling path** | Stateless Express + MongoDB Atlas (cloud-hosted, independently scalable) + Redis adapter = the backend can scale horizontally by simply adding instances with no architectural changes. |
