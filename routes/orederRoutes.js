const express = require("express");
const Order = require("../models/Order");
const router = express.Router();

// ✅ 1. Place Order (Customer)


// GST rate (example: 5%)
const GST_RATE = 0.18;

// ✅ Place Order (Customer)
router.post("/", async (req, res) => {
  try {
    const { customerId, items, paymentMethod, deliveryAddress, discount = 0 } = req.body;

    // 1️⃣ Subtotal (sum of qty * price)
    const subTotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

    // 2️⃣ GST calculation
    const gst = subTotal * GST_RATE;

    // 3️⃣ Grand total
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
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});




// ✅ 2. Cancel Order (Customer)
router.patch("/:id/cancel", async (req, res) => {
  try {
    const { customerId } = req.body; // must pass logged-in user ID
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.customerId.toString() !== customerId)
      return res.status(403).json({ error: "You can only cancel your own orders" });

    if (["Completed", "Rejected"].includes(order.orderStatus))
      return res.status(400).json({ error: "This order cannot be cancelled" });

    order.orderStatus = "Cancelled";
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ 3. Update Order Status (Admin only)
router.patch("/:id/status", async (req, res) => {
  try {
    const { role, status } = req.body;

    // if (role !== "admin")
    //   return res.status(403).json({ error: "Only admins can update order status" });

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.orderStatus = status; // must be one of enum values
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ 4. Get Customer Orders (filter by status)
router.get("/customer/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status } = req.query; // e.g. ?status=Pending
    const filter = { customerId };
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/customer/view/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    // const { status } = req.query; // e.g. ?status=Pending
    const filter = { customerId };
   
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ✅ 5. Get All Orders (Admin)
router.get("/", async (req, res) => {
  try {
    // const { role } = req.query;
    // if (role !== "admin")
    //   return res.status(403).json({ error: "Only admins can view all orders" });

    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// ✅ 5. Get All Orders (Admin)


module.exports = router;

