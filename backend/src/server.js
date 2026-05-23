const app = require("./app");
const connectDB = require("./config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5001;

// connect DB first, then start server
connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
