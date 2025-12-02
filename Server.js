const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
app.use(express.json());  // parses JSON body
app.use(cors()); // Enable CORS for all routes
dotenv.config({path:"./dotenv"});
console.log(process.env.PORT);
const connectdb = require('./Database/Connetion');
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orederRoutes");
const CouponRoutes = require("./routes/CouponRoutes");
const Dashboard = require("./routes/Dashboard");
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", CouponRoutes);
app.use("/api/dashboard", Dashboard);










app.listen(5000, () => {
    console.log("Server is running");
});