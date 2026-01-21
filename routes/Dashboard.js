const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// GET /api/dashboard/stats
router.get("/stats", async (req, res) => {
  try {
    const orders = await Order.find();

    // 1. Order status count
    const statusCounts = {
      Pending: 0,
      Preparing: 0,
      Completed: 0,
      "Out for delivery": 0,
      Delivered: 0,
      Cancelled: 0,
      Rejected: 0
    };

    // 2. Food-wise count
    const foodCounts = {};

    orders.forEach(order => {
      if (statusCounts[order.orderStatus] !== undefined) {
        statusCounts[order.orderStatus]++;
      }

      order.items.forEach(item => {
        if (!foodCounts[item.name]) foodCounts[item.name] = 0;
        foodCounts[item.name] += item.qty;
      });
    });

    // 3. Customer-wise order count (AGGREGATION)
   const customerOrderCounts = await Order.aggregate([
      {
        $group: {
          _id: "$cid",                 // customer id
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: "$finalTotal" },
          month: {
            $first: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",               // User collection name
          localField: "_id",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $project: {
          customerId: "$_id",
          customerName: "$customer.fullName",
          totalOrders: 1,
          totalSpent: 1,
          month: 1
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);

    res.json({
      totalOrders: orders.length,
      statusCounts,
      foodCounts,
      customerOrderCounts
    });
 console.log(customerOrderCounts,"Customer count")
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
