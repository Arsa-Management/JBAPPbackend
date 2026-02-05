const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");

dotenv.config({ path: "./dotenv" });

const app = express();
app.use(express.json());
app.use(cors());

// DB
const connectdb = require("./Database/Connetion");
// connectdb();
app.get("/payment-success", (req, res) => {
  res.send("Payment success");
});

app.get("/payment-failed", (req, res) => {
  res.send("Payment failed");
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/orders", require("./routes/orederRoutes"));
app.use("/api/coupons", require("./routes/CouponRoutes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/delivery", require("./routes/delivery.routes"));
app.use("/api/dashboard", require("./routes/Dashboard"));
app.use("/api/sales", require("./routes/salesReport"));
app.use("/api/recommend", require("./routes/recommendation"));
app.use("/api/payments", require("./routes/payment.routes"));

// HTTP server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

// 🔥 THIS IS THE KEY LINE
app.set("io", io);

// io.on("connection", (socket) => {
//   console.log("🟢 Socket connected:", socket.id);

//   socket.on("join_room", (roomId) => {
//     socket.join(roomId);
//     console.log(`🏠 Joined room: ${roomId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("🔴 Socket disconnected:", socket.id);
//   });
// });
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("joinCustomer", (customerId) => {
    socket.role = "customer";       // 👈 STORE ROLE
    socket.userId = customerId;     // 👈 STORE USER ID
    socket.join(`customer_${customerId}`);

    console.log("👤 Customer connected:", customerId);
  });

  socket.on("joinDelivery", (deliveryBoyId) => {
    socket.role = "delivery";
    socket.userId = deliveryBoyId;
    socket.join(`delivery_${deliveryBoyId}`);

    console.log("🚚 Delivery connected:", deliveryBoyId);
  });

  socket.on("joinAdmin", () => {
    socket.role = "admin";
    socket.join("admin");
    console.log("👑 Admin connected");
  });

  socket.on("disconnect", () => {
    console.log(
      `🔴 Disconnected socket=${socket.id}, role=${socket.role}, user=${socket.userId}`
    );
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
