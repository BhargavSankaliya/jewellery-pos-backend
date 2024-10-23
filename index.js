const express = require("express");
const connectDB = require("./database/db");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const adsRoute = require("./routes/adsRoute");
const machineRoute = require("./routes/machineRoute");
const storeRoute = require("./routes/storeRoute");
const productRoute = require("./routes/productRoute");
const machineAuthRoute = require("./routes/machineAuthRoute");
const machineMobileRoute = require("./routes/machineMobileRoute");
const productCategoryRoute = require("./routes/productCategory");
const couponRoute = require("./routes/couponRoute");
const fileUploadRoute = require("./routes/fileUploadRoute");
const orderRoute = require("./routes/orderRoute");
const path = require("path");
const { errorHandler } = require("./middlewares/error");
const verifyToken = require("./middlewares/verifyToken");
const verifyMachineToken = require("./middlewares/verifyMachineToken");
const responseInterceptor = require("./middlewares/responseInterceptor");
const config = require("./environmentVariable.json");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");

app.use(cors());
dotenv.config();
app.use(express.json({ limit: "2gb" })); // Use Express built-in JSON parser
app.use(express.urlencoded({ limit: "2gb", extended: true })); // Use Express built-in URL-encoded parser



app.use(cookieParser());
// app.use(responseInterceptor);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dirPath = "uploads";
    if (!!file.fieldname) {
      if (file.fieldname === "cImage") {
        dirPath = "uploads/product/category";
      }
      else if (file.fieldname === "adsImage" || file.fieldname === "adsVideo") {
        dirPath = "uploads/ads";
      }
      else if (file.fieldname === 'storeLogo') {
        dirPath = "uploads/storeLogo";
      }
      else if (file.fieldname === 'machineLogo') {
        dirPath = "uploads/machineLogo";
      }
      else if (file.fieldname === 'productImage' || file.fieldname === 'productVideo') {
        dirPath = "uploads/product";
      }
    }

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    cb(null, dirPath);
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({
  storage: storage,
  // limits: { fileSize: 2 * 1024 * 1024 }, // Optional: Limit file size to 2MB
}).fields([
  {
    name: "cImage",
    maxCount: 1, // Maximum of 1 file per field
  },
  {
    name: "adsImage",
    maxCount: 1, // Maximum of 1 file per field
  },
  {
    name: "adsVideo",
    maxCount: 1, // Maximum of 1 file per field
  },
  {
    name: "storeLogo",
    maxCount: 1, // Maximum of 1 file per field
  },
  {
    name: "machineLogo",
    maxCount: 1, // Maximum of 1 file per field
  },
  {
    name: "productImage",
    maxCount: 15, // Maximum of 1 file per field
  },
  {
    name: "productVideo",
    maxCount: 15, // Maximum of 1 file per field
  },
]);



app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoute);
app.use("/api/auth-mobile", machineAuthRoute);
app.use("/api/ads", verifyToken, adsRoute);
app.use("/api/machine", verifyToken, machineRoute);
app.use("/api/machine-mobile", verifyMachineToken, machineMobileRoute);
app.use("/api/store", verifyToken, storeRoute);
app.use("/api/file", upload, fileUploadRoute);
app.use("/api/product", verifyToken, productRoute);
app.use("/api/order", verifyToken, orderRoute);
app.use("/api/coupons", verifyToken, couponRoute);
app.use("/api/product/category", verifyToken, productCategoryRoute);

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    data: null,
    meta: {
      success: false,
      status: err.status || 500,
      message: err.message || "Internal Server Error",
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(errorHandler);

// Serve the static files from the dist directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve the index.html file for all requests (for Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

const http = require("http");
let server = http.createServer(app);
app.set("port", process.env.PORT || config.PORT);

server.listen(process.env.PORT || config.PORT, () => {
  connectDB();

  console.log("app is running on PORT - " + (process.env.PORT || config.PORT));
});
