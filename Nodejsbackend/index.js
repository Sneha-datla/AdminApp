const express = require("express");
const cors = require("cors");
const app = express();

// Routes
const productRoutes = require("./routes/product");
const userRoutes = require("./routes/users");
const sellGoldRoutes = require("./routes/seller");
const ordersRoutes = require("./routes/orders");
const goldloanRoutes = require("./routes/goldloan");

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/seller", sellGoldRoutes);
app.use("/order", ordersRoutes);
app.use("/loan", goldloanRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
