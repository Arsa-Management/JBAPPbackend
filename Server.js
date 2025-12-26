const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");

dotenv.config({ path: "./dotenv" });

const app = express();

// 🔹 Middlewares
app.use(express.json());
app.use(cors());

// 🔹 DB
const connectdb = require("./Database/Connetion");
connectdb();

// 🔹 Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orederRoutes"));
app.use("/api/coupons", require("./routes/CouponRoutes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/delivery", require("./routes/delivery.routes"));
app.use("/api/dashboard", require("./routes/Dashboard"));

// 🔹 Create HTTP server (IMPORTANT)
const server = http.createServer(app);

// 🔹 Socket.IO setup (RENDER SAFE)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"], // ⭐ REQUIRED for Render
});

// 🔔 Socket connection
io.on("connection", (socket) => {
  console.log("🚴 Delivery boy connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Delivery boy disconnected:", socket.id);
  });
});

// 🔹 Export io for emitting events in routes
module.exports.io = io;

// 🔹 Start server (NOT app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
