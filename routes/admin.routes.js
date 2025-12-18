const express = require("express");
const router = express.Router();
const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const role = require("../middleware/role");


// ✅ Add Delivery Boy
router.post(
  "/add-delivery-boy",
  auth,
  role("admin"),
  async (req, res) => {
    const { name, phone, password, vehicleType } = req.body;

    const user = await User.create({
      name,
      phone,
      password,
      role: "delivery"
    });

    const deliveryBoy = await DeliveryBoy.create({
      userId: user._id,
      vehicleType
    });

    res.json({
      message: "Delivery boy added",
      deliveryBoy
    });
  }
);

// ✅ Assign Delivery Boy to Order
router.put(
  "/assign-delivery",
  auth,
  role("admin"),
  async (req, res) => {
    const { orderId, deliveryBoyId } = req.body;

    const order = await Order.findById(orderId);
    order.deliveryBoyId = deliveryBoyId;
    order.status = "Picked";
    await order.save();

    await DeliveryBoy.findByIdAndUpdate(deliveryBoyId, {
      isAvailable: false
    });

    res.json({ message: "Delivery boy assigned", order });
  }
);

module.exports = router;
