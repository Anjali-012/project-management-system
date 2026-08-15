const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedDirectory = null;
let cachedAt = 0;

const getExternalUsers = asyncHandler(async (_req, res) => {
  if (cachedDirectory && Date.now() - cachedAt < CACHE_TTL_MS) {
    return res.status(200).json({ success: true, data: cachedDirectory, cached: true });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users", {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Directory service returned ${response.status}`);

    const users = await response.json();
    cachedDirectory = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      company: user.company?.name || "",
      city: user.address?.city || "",
    }));
    cachedAt = Date.now();
    res.status(200).json({ success: true, data: cachedDirectory, cached: false });
  } catch (error) {
    throw new ApiError(502, error.name === "AbortError"
      ? "External directory request timed out"
      : "External directory is currently unavailable");
  } finally {
    clearTimeout(timeout);
  }
});

module.exports = { getExternalUsers };
