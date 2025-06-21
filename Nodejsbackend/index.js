// index.js
const express = require("express");
const cors = require("cors");
const app = express();
const productRoutes = require("./routes/product");
const userRoutes = require("./routes/users"); //  import your user route
const sellGoldRoutes = require("./routes/Seller"); //  import your user route

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve images
app.use("/products", productRoutes);
app.use("/users", userRoutes); 
app.use("/seller", sellGoldRoutes); 

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
