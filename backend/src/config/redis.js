const { createClient } = require("redis");

const createRedisClients = async () => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (error) => {
    console.error("Redis pub client error:", error.message);
  });

  subClient.on("error", (error) => {
    console.error("Redis sub client error:", error.message);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);

  return {
    pubClient,
    subClient,
  };
};

module.exports = createRedisClients;
