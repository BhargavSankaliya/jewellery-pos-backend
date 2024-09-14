// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Ensure the directories exist or create them
// const ensureDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// // Define storage with a dynamic destination path
// const storage = (userId) =>
//   multer.diskStorage({
//     destination: (req, file, cb) => {
//       let uploadPath = "uploads/"; // Default upload path

//       // Adjust the path based on the request URL
//       if (req.originalUrl.startsWith("/auth/register")) {
//         uploadPath = `uploads/profile/`; // Profile picture upload path
//       } else if (req.originalUrl.startsWith("/post/create-post")) {
//         if (file.mimetype.startsWith("image/")) {
//           uploadPath = `uploads/${userId}/post/images/`; // Post image upload path
//         } else if (file.mimetype.startsWith("video/")) {
//           uploadPath = `uploads/${userId}/post/videos/`; // Post video upload path
//         }
//       }

//       // Ensure the directory exists
//       ensureDir(uploadPath);
//       cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//       const ext = path.extname(file.originalname);
//       cb(null, `${file.fieldname}-${Date.now()}${ext}`);
//     },
//   });

// const upload = (userId) => multer({ storage: storage(userId) });

// module.exports = upload;

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = (userId) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      let dirPath = "uploads";
      if (!!file.fieldname) {
        if (file.fieldname === "profilePicture") {
          dirPath = "uploads/profiles";
        } else if (file.fieldname === "pImages") {
          dirPath = `uploads/${req.user._id}/post/images`;
        } else if (file.fieldname === "pVideos") {
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

const upload = (userId) =>
  multer({
    storage: storage(userId),
  });

module.exports = upload;
