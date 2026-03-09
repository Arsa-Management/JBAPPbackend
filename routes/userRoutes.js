const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Order = require("../models/Order");
const DeliveryBoy = require("../models/DeliveryBoy");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const validatePassword = (password) => {
  if (!password || password.length < 8)
    return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Add at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Add at least one lowercase letter";
  if (!/[0-9]/.test(password))
    return "Add at least one number";
  if (!/[@$!%*?&]/.test(password))
    return "Add at least one special character";
  return null;
};

// ➤ Create User
router.post("/", async (req, res) => {
  try {
    let { fullName, email, phone, password } = req.body;

    // Required fields
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Normalize email (IMPORTANT)
    email = email.toLowerCase().trim();

    // Password validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Check existing user (case-insensitive)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save user
    const newUser = new User({
      fullName,
      email, // saved in lowercase
      phone,
      passwordHash,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}); 
// Login User / Delivery Boy
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // 3. Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 4. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/delivery", async (req, res) => {
  try {
    const deliveryBoys = await User.find({ role: "delivery" });

    const result = await Promise.all(
      deliveryBoys.map(async (d) => {

        // find delivery boy record linked to this user
        const deliveryBoy = await DeliveryBoy.findOne({ userId: d._id });

        let orderCount = 0;

        if (deliveryBoy) {
          orderCount = await Order.countDocuments({
            deliveryBoyId: deliveryBoy._id,
            orderStatus: "Delivered"
          });
        }

        return {
          name: d.fullName,
          phone: d.phone,
          email: d.email,
          totalOrders: orderCount
        };
      })
    );

    res.json(result);

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-delivery-boy", async (req, res) => {
  try {

    const { fullName, email, phone, password, vehicleType } = req.body;
console.log(req.body);

    // ⚠️ In real app: check admin JWT here

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with delivery role
    const deliveryUser = await User.create({
      fullName,
      email,
      phone,
      passwordHash,
      role: "delivery"
    });

    // Create delivery profile
    const deliveryBoy = await DeliveryBoy.create({
      userId: deliveryUser._id,
      vehicleType
    });

    res.status(201).json({
      message: "Delivery boy added successfully",
      deliveryBoy
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➤ Get All Users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({ role: "customer" });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ➤ Get Single User
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ➤ Update User
router.put("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ➤ Delete User
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/address/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
console.log(req.params);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.push(req.body);
    await user.save();

    res.status(201).json({
      message: "Address added successfully",
      addresses: user.addresses
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ➤ GET ALL ADDRESSES
router.get("/address/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("addresses");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.addresses);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ➤ UPDATE ADDRESS
router.put("/address/:userId/:addressId", async (req, res) => {
  try {
    const { userId, addressId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    Object.assign(address, req.body);
    await user.save();

    res.json({
      message: "Address updated successfully",
      address
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ➤ DELETE ADDRESS (optional)
router.delete("/address/:userId/:addressId", async (req, res) => {
  try {
    console.log("inside delete")
    const user = await User.findById(req.params.userId);
    console.log("user")

    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    res.json({ message: "Address deleted successfully" });

  } catch (err) {
    console.log("error",err)
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
