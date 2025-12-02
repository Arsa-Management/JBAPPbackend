const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const orders = await Order.find();

    // Count order statuses
    const statusCounts = {
      Pending: 0,
      Preparing: 0,
      Completed: 0,
      "Out for delivery": 0,
      Delivered: 0,
      Cancelled: 0,
      Rejected: 0
    };

    // Food-wise count
    const foodCounts = {};

    orders.forEach(order => {
      // 1. Count statuses
      if (statusCounts[order.orderStatus] !== undefined) {
        statusCounts[order.orderStatus]++;
      }

      // 2. Count food items
      order.items.forEach(item => {
        if (!foodCounts[item.name]) foodCounts[item.name] = 0;
        foodCounts[item.name] += item.qty;
      });
    });

    res.json({
      totalOrders: orders.length,
      statusCounts,
      foodCounts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
