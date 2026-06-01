# Planning And Design

## Functional Requirement Document

Core features:

- Users can register and log in with JWT authentication.
- Authenticated users can create projects and see only projects where they are members.
- Project creators or admins can add members by email.
- Project members can create, view, update, and move tasks between Todo, In Progress, and Done.
- Users viewing the same project receive task create/update/delete events in real time.
- Activity is recorded for task changes, and notifications are created for project member additions and task assignments.

Roles and permissions:

- `member`: can access projects they belong to and manage tasks in those projects.
- `admin`: can add members to any project and delete tasks.
- Project creator: can add members to their own project.

Assumptions:

- Teams are internal, so project membership is the primary authorization boundary.
- A task can be assigned only to a project member.
- Task deletion is soft delete to keep history auditable.
- Redis is required for horizontally scaled socket deployments, but optional for local development.

Out of scope:

- File attachments, comments, mentions, sprint planning, email delivery, and payment/billing.
- Full drag-and-drop; status changes are supported through controlled selects.

## System Design

High-level architecture:

```text
React/Vite
  | REST + JWT
  v
Express API ---- MongoDB
  |
  | Socket.IO + JWT
  v
Project rooms
  |
  v
Redis adapter when REDIS_URL is configured
```

Database collections:

- `users`: name, email, password hash, role.
- `projects`: title, description, createdBy, members.
- `tasks`: title, description, status, project, assignedTo, createdBy, isDeleted, deletedAt.
- `activities`: project, user, action, metadata.
- `notifications`: user, message, type, read status.

Real-time strategy:

- The socket handshake verifies the JWT.
- A client joins one room per selected project via `project:join`.
- The server confirms project membership before joining the room.
- REST handlers emit socket events only after database writes succeed.
- Clients merge incoming events into local board state.

Why this approach:

- REST keeps validation, authorization, and persistence straightforward.
- Socket rooms prevent broadcasting unrelated project updates.
- Redis adapter support allows multiple backend instances to share socket events.

Scalability considerations:

- Add indexes on `Project.members`, `Task.project`, and `Task.status` for larger datasets.
- Use Redis adapter in production when running more than one API instance.
- Keep socket payloads task-sized; fetch full project data over REST.
- Paginate task lists for very large projects.
