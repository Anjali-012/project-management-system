const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const { initSocket } = require("./sockets");
require("dotenv").config();

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// connect DB first, then start server
connectDB();
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
