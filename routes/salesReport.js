const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

router.get("/sales-customer", async (req, res) => {
  try {
    const orders = await Order.find();

    let totalSales = 0;
    let dailySalesMap = {};
    let customerMap = {};

    orders.forEach((o) => {
      const date = o.Bdate; // already string like M/D/YYYY

      totalSales += o.finalTotal || 0;

      // Daily sales
      dailySalesMap[date] = (dailySalesMap[date] || 0) + (o.finalTotal || 0);

      // Customer orders count
      customerMap[o.cid] = (customerMap[o.cid] || 0) + 1;
    });

    const repeatCustomers = Object.values(customerMap).filter(v => v > 1).length;
    const newCustomers = Object.values(customerMap).filter(v => v === 1).length;

    res.json({
      totalSales,
      dailySales: dailySalesMap,
      customers: {
        new: newCustomers,
        repeat: repeatCustomers
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Stats fetch failed" });
  }
});

module.exports = router;
