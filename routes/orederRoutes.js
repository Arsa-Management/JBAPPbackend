const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

// GST rate
const GST_RATE = 0.18;

/* =========================================================
   1️⃣ PLACE ORDER (CUSTOMER)
========================================================= */
router.post("/", async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentMethod,
      deliveryAddress,
      discount = 0,
    } = req.body;

    const subTotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const gst = subTotal * GST_RATE;
    const grandTotal = subTotal - discount + gst;

    const newOrder = new Order({
      customerId,
      items,
      subTotal,
      discount,
      gst,
      grandTotal,
      paymentMethod,
      deliveryAddress,
      orderStatus: "Pending",
    });

    await newOrder.save();

    // 🔴 REAL-TIME: notify customer (room = customerId)
    const io = req.app.get("io");
    io.to(customerId.toString()).emit("orderPlaced", {
      orderId: newOrder._id,
      status: newOrder.orderStatus,
    });

    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =========================================================
   2️⃣ CANCEL ORDER (CUSTOMER)
========================================================= */
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { customerId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.customerId.toString() !== customerId)
      return res
        .status(403)
        .json({ error: "You can only cancel your own orders" });

    if (["Completed", "Rejected"].includes(order.orderStatus))
      return res
        .status(400)
        .json({ error: "This order cannot be cancelled" });

    order.orderStatus = "Cancelled";
    await order.save();

    // 🔴 REAL-TIME UPDATE
    const io = req.app.get("io");
    io.to(customerId.toString()).emit("orderStatusUpdated", {
      orderId: order._id,
      status: order.orderStatus,
      deliveryBoy: null,
    });

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =========================================================
   3️⃣ UPDATE ORDER STATUS / ASSIGN DELIVERY BOY (ADMIN)
========================================================= */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, deliveryBoyId } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: status,
        ...(deliveryBoyId && { deliveryBoyId }),
      },
      { new: true }
    ).populate({
      path: "deliveryBoyId",
      populate: {
        path: "userId",
        select: "fullName phone",
      },
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    // 🔥 REAL-TIME UPDATE TO CUSTOMER
    const io = req.app.get("io");
    io.to(order.customerId.toString()).emit("orderStatusUpdated", {
      orderId: order._id,
      status: order.orderStatus,
      deliveryBoy: order.deliveryBoyId
        ? {
            name: order.deliveryBoyId.userId.fullName,
            phone: order.deliveryBoyId.userId.phone,
            vehicleType: order.deliveryBoyId.vehicleType,
          }
        : null,
    });

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =========================================================
   4️⃣ GET CUSTOMER ORDERS
========================================================= */
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query;

    const filter = { customerId };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate({
        path: "deliveryBoyId",
        populate: {
          path: "userId",
          select: "fullName phone",
        },
      })
      .sort({ createdAt: -1 });

    // 🔁 Clean response
    const response = orders.map((order) => ({
      ...order.toObject(),
      deliveryBoy: order.deliveryBoyId
        ? {
            name: order.deliveryBoyId.userId.fullName,
            phone: order.deliveryBoyId.userId.phone,
            vehicleType: order.deliveryBoyId.vehicleType,
          }
        : null,
    }));

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =========================================================
   5️⃣ GET ALL ORDERS (ADMIN)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "deliveryBoyId",
        populate: {
          path: "userId",
          select: "fullName phone",
        },
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/* =========================================================
   6️⃣ GET ORDER STATUS (ORDER SUCCESS SCREEN)
========================================================= */
router.get("/:id/status", async (req, res) => {
  try {
   const order = await Order.findById(req.params.id).populate({
  path: "deliveryBoyId",
  model: "User",
  select: "fullName phone",
});

    if (!order) return res.status(404).json({ error: "Order not found" });

   res.json({
  status: order.orderStatus,
  deliveryBoy: order.deliveryBoyId
    ? {
        name: order.deliveryBoyId.fullName,
        phone: order.deliveryBoyId.phone,
      }
    : null,
});

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
