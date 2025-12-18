const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

router.get(
  "/my-orders",
  auth,
  role("delivery"),
  async (req, res) => {
    const orders = await Order.find({
      deliveryBoyId: req.user.userId
    });

    res.json(orders);
  }
);

module.exports = router;
