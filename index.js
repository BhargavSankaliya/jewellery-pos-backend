const express = require("express");
const connectDB = require("./database/db");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const path = require("path");
const { errorHandler } = require("./middlewares/error");
const verifyToken = require("./middlewares/verifyToken");
const responseInterceptor = require("./middlewares/responseInterceptor");
const config = require("./environmentVariable.json");
const multer = require("multer");
const fs = require("fs");

dotenv.config();
app.use(express.json({ limit: "2gb" })); // Use Express built-in JSON parser
app.use(express.urlencoded({ limit: "2gb", extended: true })); // Use Express built-in URL-encoded parser



app.use(cookieParser());
// app.use(responseInterceptor);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dirPath = "uploads";
    if (!!file.fieldname) {
      if (file.fieldname === "profilePicture") {
        dirPath = "uploads/profiles";
      } else if (file.fieldname === "pimage") {
        dirPath = `uploads/${req.user._id}/post/images`;
      } else if (file.fieldname === "pvideo") {
        dirPath = `uploads/${req.user._id}/post/videos`;
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
});

var cpUpload = upload.fields([
  {
    name: "profilePicture",
    maxCount: 1,
  }, {
    name: "pimage",
    maxCount: 15,
  }, {
    name: "pvideo",
    maxCount: 15,
  },
]);



app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", cpUpload, authRoute);
// app.use("/api/file", verifyToken, cpUpload, fileUploadRoute);

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

const http = require("http");
let server = http.createServer(app);
app.set("port", process.env.PORT || config.PORT);

server.listen(process.env.PORT || config.PORT, () => {
  connectDB();

  console.log("app is running on PORT - " + (process.env.PORT || config.PORT));
});
