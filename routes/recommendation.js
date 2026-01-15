const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

// REAL-TIME TRENDING FOOD
router.get("/realtime", async (req, res) => {
  try {
    const lastMinutes = 60; // 1 hour window

    const trending = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - lastMinutes * 60 * 1000),
          },
          orderStatus: { $ne: "Cancelled" },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQty: { $sum: "$items.qty" },
          price: { $first: "$items.price" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 6 },
    ]);

    res.json(trending);
  } catch (err) {
    res.status(500).json({ message: "Recommendation failed" });
  }
});

module.exports = router;
