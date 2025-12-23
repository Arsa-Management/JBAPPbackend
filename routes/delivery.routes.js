const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.get(
  "/my-orders",
  // auth,
  // role("delivery"),
  async (req, res) => {
    const orders = await Order.find({
      deliveryBoyId: req.user.userId
    });

    res.json(orders);
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

    // Status validation
    const allowed = ["Out for delivery", "Delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    order.orderStatus = status;

    // When delivered → free delivery boy
    if (status === "Delivered" && order.deliveryBoyId) {
      await DeliveryBoy.findByIdAndUpdate(order.deliveryBoyId, {
        isAvailable: true,
      });
    }

    await order.save();

    res.json({
      message: `Order marked as ${status}`,
      order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
