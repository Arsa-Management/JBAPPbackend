const express = require("express");
const Order = require("../models/Order");

const router = express.Router();

router.get("/sales-customers", async (req, res) => {
  try {
    const orders = await Order.find({
      orderStatus: { $ne: "Cancelled" }
    });

    let totalSales = 0;
    let dailySalesMap = {};
    let customerMap = {};

    orders.forEach((order) => {
      // TOTAL SALES
      totalSales += order.grandTotal || 0;

      // DATE-WISE SALES
      const date = new Date(order.createdAt).toLocaleDateString("en-IN");

      dailySalesMap[date] =
        (dailySalesMap[date] || 0) + (order.grandTotal || 0);

      // CUSTOMER COUNT
      const customerId = order.customerId.toString();
      customerMap[customerId] = (customerMap[customerId] || 0) + 1;
    });

    const newCustomers = Object.values(customerMap).filter(c => c === 1).length;
    const repeatCustomers = Object.values(customerMap).filter(c => c > 1).length;

    res.json({
      totalSales,
      dailySales: dailySalesMap,
      customers: {
        new: newCustomers,
        repeat: repeatCustomers
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Sales report error" });
  }
});

module.exports = router;
