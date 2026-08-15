const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../repositories/postgres.repository");
const ApiError = require("../utils/ApiError");

const register = async ({ name, email, password, role = "member" }) => {
  if (await db.findUserByEmail(email)) throw new ApiError(400, "User already exists");
  const user = await db.createUser({ name, email, password: await bcrypt.hash(password, 10), role });
  return user;
};
const login = async ({ email, password }) => {
  const user = await db.findUserWithPassword(email);
  if (!user || !(await bcrypt.compare(password, user.password))) throw new ApiError(400, "Invalid credentials");
  const safeUser = db.toUser(user);
  return { token: jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" }), user: safeUser };
};
module.exports = { register, login };
