const express = require("express");
const router = express.Router();
const User = require("../models/User");
const DeliveryBoy = require("../models/DeliveryBoy");
const Order = require("../models/Order");
const auth = require("../middleware/auth");
const role = require("../middleware/role");


// ✅ Add Delivery Boy
// router.post(
//   "/add-delivery-boy",
//   auth,
//   role("admin"),
//   async (req, res) => {
//     const { name, phone, password, vehicleType } = req.body;

//     const user = await User.create({
//       name,
//       phone,
//       password,
//       role: "delivery"
//     });

//     const deliveryBoy = await DeliveryBoy.create({
//       userId: user._id,
//       vehicleType
//     });

//     res.json({
//       message: "Delivery boy added",
//       deliveryBoy
//     });
//   }
// );

// ✅ Assign Delivery Boy to Order
router.put(
  "/assign-delivery",
  auth,
  // role("admin"),
  async (req, res) => {
    try {
      const { orderId, deliveryBoyId } = req.body;

      if (!orderId || !deliveryBoyId) {
        return res.status(400).json({ message: "OrderId and DeliveryBoyId are required" });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
      if (!deliveryBoy) {
        return res.status(404).json({ message: "Delivery boy not found" });
      }

      if (!deliveryBoy.isAvailable) {
        return res.status(400).json({ message: "Delivery boy is not available" });
      }

      order.deliveryBoyId = deliveryBoyId;
      order.status = "Picked";
      await order.save();

      deliveryBoy.isAvailable = false;
      await deliveryBoy.save();

      res.json({
        message: "Delivery boy assigned successfully",
        order,
      });
    } catch (error) {
      console.error("Assign delivery error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);


// ➤ GET ALL DELIVERY BOYS
router.get("/delivery-boys", async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find()
      .populate("userId", "fullName email phone");

    res.json(deliveryBoys);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
