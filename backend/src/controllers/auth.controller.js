const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const registerUser = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: user,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

module.exports = {
  registerUser,
  loginUser,
};
