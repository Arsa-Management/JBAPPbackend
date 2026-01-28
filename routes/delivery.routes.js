const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Delivery = require("../models/DeliveryBoy.js");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.get(
  "/my-orders",
  auth,
  role("delivery"),
  async (req, res) => {
    try {
      console.log("inside order");
      
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // 1️⃣ Find delivery profile
      const delivery = await Delivery.findOne({
        userId: req.user.userId,
      }).select("_id");

      if (!delivery) {
        return res.status(404).json({ message: "Delivery profile not found" });
      }

      // 2️⃣ Fetch paginated orders
      const orders = await Order.find({
        deliveryBoyId: delivery._id,
      })
        .sort({ createdAt: -1 })       // 🔥 newest first
        .skip(skip)
        .limit(limit)
        .select(
          "items orderStatus grandTotal deliveryAddress createdAt"
        ); // 🔥 only needed fields

      // 3️⃣ Check if more data exists
      const total = await Order.countDocuments({
        deliveryBoyId: delivery._id,
      });

      res.json({
        orders,
        hasMore: skip + orders.length < total,
      });
    } catch (error) {
      console.error("❌ my-orders error:", error);
      res.status(500).json({ message: "Server error" });
      console.log("error",error);
      
    }
  }
);


router.put("/delivery/order-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ message: "OrderId and status are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Status validation
    const allowed = ["Out for delivery", "Delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    order.orderStatus = status;

    // ✅ Free delivery boy after delivery
    if (status === "Delivered" && order.deliveryBoyId) {
      await Delivery.findByIdAndUpdate(order.deliveryBoyId, {
        isAvailable: true,
      });
    }

    await order.save();

    /* 🔥 SOCKET EMIT */
    const io = req.app.get("io");

    // ✅ Emit to CUSTOMER ROOM (IMPORTANT FIX)
    io.to(`customer_${order.customerId.toString()}`).emit(
      "orderStatusUpdated",
      {
        orderId: order._id.toString(),
        status: order.orderStatus,
      }
    );

    // 🔔 OPTIONAL: notify admin
    io.to("admin").emit("adminOrderUpdate", {
      orderId: order._id.toString(),
      status: order.orderStatus,
    });

    console.log(
      "📡 Socket emitted → customer_",
      order.customerId.toString(),
      order.orderStatus
    );

    res.json({
      message: `Order marked as ${status}`,
      order,
    });
  } catch (error) {
    console.error("❌ Delivery status update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Singel Order Fetch
router.get(
  "/order/:id",
  auth,
  role("delivery"),
  async (req, res) => {
    try {
      const delivery = await Delivery.findOne({
        userId: req.user.userId,
      });

      if (!delivery) {
        return res
          .status(404)
          .json({ message: "Delivery profile not found" });
      }

      const order = await Order.findOne({
        _id: req.params.id,
        Delivery: delivery._id,
      });

      if (!order) {
        return res.status(404).json({
          message: "Order not found or not assigned to you",
        });
      }

      res.json(order);
    } catch (error) {
      console.error("❌ fetch order error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);



module.exports = router;
