const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true }, // price per unit
});

const orderSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],

    subTotal: { type: Number, required: true },   // qty * price
    discount: { type: Number, default: 0 },       // discount applied
    gst: { type: Number, required: true },        // tax amount
    grandTotal: { type: Number, required: true }, // subTotal - discount + gst

    paymentMethod: { type: String, enum: ["UPI", "Card", "Wallet", "COD"], required: true },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
    orderStatus: {
      type: String,
      enum: ["Pending", "Preparing", "Out for delivery", "Completed", "Delivered" ,"Cancelled", "Rejected"],
      default: "Pending",
    },
    deliveryAddress: { type: Object, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

