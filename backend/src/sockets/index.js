const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const db = require("../repositories/postgres.repository");
const createRedisClients = require("../config/redis");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
    },
  });

  createRedisClients()
    .then((clients) => {
      if (clients) {
        io.adapter(createAdapter(clients.pubClient, clients.subClient));
        console.log("Socket.IO Redis adapter connected");
      }
    })
    .catch((error) => {
      console.error("Socket.IO Redis adapter disabled:", error.message);
    });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (error) {
      return next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    // presence: track which users are in which project room
    const broadcastPresence = async (projectId) => {
      const room = io.sockets.adapter.rooms.get(`project:${projectId}`);
      if (!room) return;

      // collect unique userIds from all sockets in the room
      const userIds = [];
      const seen = new Set();
      for (const sid of room) {
        const s = io.sockets.sockets.get(sid);
        if (s?.user?.userId && !seen.has(s.user.userId)) {
          seen.add(s.user.userId);
          userIds.push(s.user.userId);
        }
      }

      // batch-fetch names from DB
      const dbUsers = (await db.query("SELECT id, name FROM users WHERE id = ANY($1::uuid[])", [userIds])).rows;
      const nameMap = Object.fromEntries(dbUsers.map((u) => [u.id, u.name]));

      const users = userIds.map((id) => ({ id, name: nameMap[id] ?? "Member" }));
      io.to(`project:${projectId}`).emit("presence:update", { projectId, users });
    };

    socket.on("project:join", async (projectId, ack) => {
      try {
        const project = await db.findProject(projectId);
        if (!project) throw new Error("Project not found");
        const isMember = socket.user.role === "admin" || await db.isMember(socket.user.userId, projectId);
        if (!isMember) throw new Error("Not a project member");
        socket.join(`project:${projectId}`);
        broadcastPresence(projectId).catch(() => undefined);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
      broadcastPresence(projectId).catch(() => undefined);
    });

    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("project:")) {
          const projectId = room.replace("project:", "");
          setImmediate(() => broadcastPresence(projectId).catch(() => undefined));
        }
      }
    });
  });

  return io;
};

const emitToProject = (projectId, event, payload) => {
  if (!io || !projectId) {
    return;
  }

  io.to(`project:${projectId}`).emit(event, payload);
};

module.exports = {
  emitToProject,
  initSocket,
};
