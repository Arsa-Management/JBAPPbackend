const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  name: String,
  phone:String,
  houseNo:String,
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
});

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true
}

    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "admin", "delivery"], default: "customer" },
    phone: { type: String },
    addresses: [addressSchema],
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

module.exports = mongoose.model("User", userSchema);
