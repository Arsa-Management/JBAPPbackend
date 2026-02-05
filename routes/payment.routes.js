const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ================= CREATE ORDER ================= */
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount required" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // ₹ → paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ Razorpay order error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

/* ================= VERIFY PAYMENT ================= */
// router.post("/verify", (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = req.body;

//     const body =
//       razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     if (expectedSignature === razorpay_signature) {
//       return res.status(200).json({
//         success: true,
//         paymentId: razorpay_payment_id,
//       });
//     } else {
//       return res.status(400).json({ success: false });
//     }
//   } catch (err) {
//     console.error("❌ Verification error:", err);
//     res.status(500).json({ error: "Payment verification failed" });
//   }
// });

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerId,
      items,
      deliveryAddress,
      paymentMethod = "UPI",
      discount = 0,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false });
    }

    /* ================= CREATE ORDER AFTER PAYMENT ================= */

    const subTotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0
    );

    const GST_RATE = 0.18;
    const gst = subTotal * GST_RATE;
    const grandTotal = subTotal - discount + gst;

    const newOrder = await Order.create({
      customerId,
      items,
      subTotal,
      discount,
      gst,
      grandTotal,
      paymentMethod,
      paymentStatus: "Paid",
      orderStatus: "Pending",
      deliveryAddress,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    /* ================= SOCKET UPDATE ================= */
    const io = req.app.get("io");
    io.to("admin").emit("adminOrderUpdate", {
      orderId: newOrder._id.toString(),
      status: newOrder.orderStatus,
      total: newOrder.grandTotal,
    });

    return res.status(201).json({
      success: true,
      orderId: newOrder._id,
    });
  } catch (err) {
    console.error("❌ Verification error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});


module.exports = router;
