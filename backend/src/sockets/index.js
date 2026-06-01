const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const Project = require("../models/project.model");
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
    socket.on("project:join", async (projectId, ack) => {
      try {
        const project = await Project.findById(projectId);

        if (!project) {
          throw new Error("Project not found");
        }

        const isMember = project.members.some(
          (memberId) => memberId.toString() === socket.user.userId,
        );

        if (!isMember) {
          throw new Error("Not a project member");
        }

        socket.join(`project:${projectId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("project:leave", (projectId) => {
      socket.leave(`project:${projectId}`);
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
