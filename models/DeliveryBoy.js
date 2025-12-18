const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  vehicleType: String,
  isAvailable: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);
