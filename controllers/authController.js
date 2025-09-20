const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { CustomError, errorHandler } = require("../middlewares/error");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { sendOTPEmail, sendOTPPhone } = require("../helper/otpHelper");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const StoreModel = require("../models/storeModel.js");
const { productModel } = require("../models/productModel.js");
const authController = {}
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');



// Configure AWS S3 Client
const s3 = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

const fileInS3Upload = async (files, path) => {

  const fileKey = `${path}/${Date.now()}-${files.fieldname}`;
  const params = {
    Bucket: config.bucketName, // Corrected key name
    Key: fileKey, // Corrected key name
    Body: files.buffer, // Corrected key name
    ContentType: files.mimetype,
    ACL: 'public-read',
  };
  await s3.send(new PutObjectCommand(params));
  return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;

}

const FileUpload = async (req, res, next) => {
  try {

    let cImage = '';
    let adsImage = '';
    let adsVideo = '';
    let storeLogo = '';
    let productImage = '';
    let productVideo = '';
    let machineLogo = '';
    let iosApk = '';
    let machineImage = '';
    let androidApk = '';

    if (req.files && !!req.files.cImage && req.files.cImage.length > 0) {
      const cUploadIMage = req.files.cImage.map(async (x) => {
        cImage = await fileInS3Upload(x, "uploads/product/category")
      })

      await Promise.all(cUploadIMage);
    }
    else {
      cImage = "";
    }

    if (req.files && !!req.files.machineImage && req.files.machineImage.length > 0) {
      const cUploadIMage = req.files.machineImage.map(async (x) => {
        machineImage = await fileInS3Upload(x, "uploads/machineImage")
      })

      await Promise.all(cUploadIMage);
    }
    else {
      machineImage = "";
    }

    if (req.files && !!req.files.iosApk && req.files.iosApk.length > 0) {
      const cUploadIMage = req.files.iosApk.map(async (x) => {
        iosApk = await fileInS3Upload(x, "uploads/apk")
      })

      await Promise.all(cUploadIMage);
    }
    else {
      iosApk = "";
    }

    if (req.files && !!req.files.androidApk && req.files.androidApk.length > 0) {
      const cUploadIMage = req.files.androidApk.map(async (x) => {
        androidApk = await fileInS3Upload(x, "uploads/apk")
      })

      await Promise.all(cUploadIMage);
    }
    else {
      androidApk = "";
    }

    if (req.files && !!req.files.adsImage && req.files.adsImage.length > 0) {
      const adsImageU = req.files.adsImage.map(async (x) => {
        adsImage = await fileInS3Upload(x, "uploads/ads")
      })

      await Promise.all(adsImageU);
    }
    else {
      adsImage = '';
    }

    if (req.files && !!req.files.productImage && req.files.productImage.length > 0) {

      const productImageu = req.files.productImage.map(async (x) => {
        productImage = await fileInS3Upload(x, "uploads/product")
      })

      await Promise.all(productImageu);
    }
    else {
      productImage = '';
    }



    if (req.files && !!req.files.productVideo && req.files.productVideo.length > 0) {
      const productVideoU = req.files.productVideo.map(async (x) => {
        productVideo = await fileInS3Upload(x, "uploads/product")
      })

      await Promise.all(productVideoU);
    }
    else {
      productVideo = '';
    }

    if (req.files && !!req.files.adsVideo && req.files.adsVideo.length > 0) {
      const adsVideoU = req.files.adsVideo.map(async (x) => {
        adsVideo = await fileInS3Upload(x, "uploads/ads")
      })

      await Promise.all(adsVideoU);
    }
    else {
      adsVideo = '';
    }

    if (req.files && !!req.files.storeLogo && req.files.storeLogo.length > 0) {
      const storeLogoU = req.files.storeLogo.map(async (x) => {
        storeLogo = await fileInS3Upload(x, "uploads/storeLogo")
      })

      await Promise.all(storeLogoU);
    }
    else {
      storeLogo = '';
    }

    if (req.files && !!req.files.machineLogo && req.files.machineLogo.length > 0) {
      const machineLogoU = req.files.machineLogo.map(async (x) => {
        machineLogo = await fileInS3Upload(x, "uploads/machineLogo")
      })

      await Promise.all(machineLogoU);
    }
    else {
      machineLogo = '';
    }


    // if (req.files[findKey] && req.files[findKey].length > 0) {
    //   const fileUploadPromises = req.files[findKey].map(async (file) => {
    //     const fileKey = `uploads/${Date.now()}-${path.basename(file.originalname)}`;
    //     const params = {
    //       Bucket: config.bucketName, // Corrected key name
    //       Key: fileKey, // Corrected key name
    //       Body: file.buffer, // Corrected key name
    //       ContentType: file.mimetype,
    //       ACL: 'public-read',
    //     };
    //     await s3.send(new PutObjectCommand(params));
    //     return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${fileKey}`;
    //   });

    //   uploadedFiles[findKey] = await Promise.all(fileUploadPromises); // Store uploaded files
    // } else {
    //   uploadedFiles[findKey] = [];
    // }

    // res.status(200).json({
    //   success: true,
    //   message: 'Files uploaded successfully.',
    //   data: uploadedFiles
    // });
    createResponse({
      cImage,
      adsVideo,
      adsImage,
      storeLogo,
      machineLogo,
      productImage,
      productVideo,
      androidApk,
      iosApk,
      machineImage
    }, 200, 'File Upload Successfully.', res)

  } catch (error) {
    errorHandler(error, res, res)
  }
}


// const FileUpload = async (req, res, next) => {
//   try {
//     const file = [];
//     const configURL = config.URL;

//     let cImage = '';
//     let adsImage = '';
//     let adsVideo = '';
//     let storeLogo = '';
//     let productImage = '';
//     let productVideo = '';

//     if (req.files && !!req.files.cImage && req.files.cImage.length > 0) {
//       req.files.cImage.map((x) => {
//         cImage = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       cImage = "";
//     }

//     if (req.files && !!req.files.adsImage && req.files.adsImage.length > 0) {
//       req.files.adsImage.map((x) => {
//         adsImage = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       adsImage = '';
//     }

//     if (req.files && !!req.files.productImage && req.files.productImage.length > 0) {
//       req.files.productImage.map((x) => {
//         productImage = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       productImage = '';
//     }
//     if (req.files && !!req.files.productVideo && req.files.productVideo.length > 0) {
//       req.files.productVideo.map((x) => {
//         productVideo = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       productVideo = '';
//     }

//     if (req.files && !!req.files.adsVideo && req.files.adsVideo.length > 0) {
//       req.files.adsVideo.map((x) => {
//         adsVideo = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       adsVideo = '';
//     }

//     if (req.files && !!req.files.storeLogo && req.files.storeLogo.length > 0) {
//       req.files.storeLogo.map((x) => {
//         storeLogo = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       storeLogo = '';
//     }

//     if (req.files && !!req.files.machineLogo && req.files.machineLogo.length > 0) {
//       req.files.machineLogo.map((x) => {
//         machineLogo = configURL + x.destination + "/" + x.filename
//       })
//     }
//     else {
//       machineLogo = '';
//     }

//     createResponse({
//       cImage, adsVideo, adsImage, storeLogo, machineLogo, productImage, productVideo
//     }, 200, 'File Upload Successfully.', res)

//   } catch (error) {
//     errorHandler(error, res, res)
//   }
// }

// resend otp api
authController.ResendOtpController = async (req, res, next) => {
  try {
    const { storeId } = req.body;

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    const updateObject = {
      otp: otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await StoreModel.findOneAndUpdate({ _id: storeId }, updateObject);

    const store = await StoreModel.findById(storeId);

    await sendOTPEmail(store.email, otpCode, req, res);

    createResponse(null, 200, "Please verify your email/phone using the OTP resent.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Login API
authController.LoginUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new CustomError(
        "Email is required for login!",
        1010
      );
    }

    if (!password) {
      throw new CustomError(
        "Password is required for login!",
        1010
      );
    }

    let store = await StoreModel.findOne({ email: email.toLocaleLowerCase(), isDeleted: false });

    if (!store) {
      throw new CustomError("Email is wrong!", 1010);
    }

    if (store.status == 'Inactive') {
      throw new CustomError("Store is not activated!", 1010);
    }


    const match = await bcrypt.compare(password, store.password);
    if (!match) {
      throw new CustomError("Wrong credentials!", 1010);
    }

    const token = jwt.sign({ _id: store._id }, config.JWT_SECRET, {
      expiresIn: "90d",
    });

    store.jwtToken = token;
    store.save();

    let responseObject = {
      name: store.name,
      id: store._id,
      address: store.address,
      logo: store.logo,
      description: store.description,
      gstNumber: store.gstNumber,
      phone: store.phone,
      email: store.email,
      instagramUrl: store.instagramUrl,
      facebookUrl: store.facebookUrl,
      youtubeUrl: store.youtubeUrl,
      twitterUrl: store.twitterUrl,
      locations: store.locations,
      role: store.role,
      status: store.status,
      token: token
    }

    createResponse(responseObject, 200, "Login Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Forget Password API
authController.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError("Email is required!", 400);
    }

    const Store = await StoreModel.findOne({ email });
    if (!Store) {
      throw new CustomError("Store not found!", 404);
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000);
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    Store.resetPasswordToken = resetToken;
    Store.resetPasswordExpiry = resetTokenExpiry;
    await Store.save();

    // const resetUrl = `${config.URL}/reset-password?token=${resetToken}`;
    await sendOTPEmail(email, resetToken, req, res);

    return createResponse({ storeId: Store._id.toString() }, 200, "Please verify your OTP for update password!", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

//  Verify OTP API
authController.VerifyOtpForUpdatePasswordController = async (req, res, next) => {
  try {
    const { storeId, resetPasswordToken } = req.body;

    const store = await StoreModel.findOne({ _id: storeId, resetPasswordToken });

    if (!store || new Date() > store.resetPasswordExpiry) {
      throw new CustomError("Invalid or expired OTP.", 400);
    }

    // Mark store as verified
    store.resetPasswordToken = undefined; // Clear the OTP
    store.resetPasswordExpiry = undefined; // Clear the OTP expiration
    store.resetPasswordTokenVerify = true;

    await store.save();

    createResponse({ storeId: storeId }, 200, "OTP verified successfully.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

//  Verify OTP API
authController.updatePasswordAfterVerifyOTP = async (req, res, next) => {
  try {
    const { storeId, password } = req.body;

    if (!password) {
      throw new CustomError("Password is required!", 400);
    }

    const store = await StoreModel.findOne({
      _id: storeId,
      resetPasswordTokenVerify: true,
    });

    if (!store) {
      throw new CustomError("Please Verify OTP!", 400);
    }

    const salt = await bcrypt.genSalt(10);
    store.password = await bcrypt.hash(password, salt);
    store.resetPasswordTokenVerify = false;

    await store.save();
    createResponse(null, 200, "Password has been reset successfully!", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Reset Password Controller
authController.resetPassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    if (!password) {
      throw new CustomError("Password is required!", 400);
    }
    if (!newPassword) {
      throw new CustomError("New Password is required!", 400);
    }

    const store = req.store;

    const salt = await bcrypt.genSalt(10);
    const oldPassword = await bcrypt.hash(password, salt);
    if (store.password != oldPassword) {
      throw new CustomError("Password is not Match!", 400);
    }

    if (password == newPassword) {
      throw new CustomError(
        "Old Password and New Password is Match, Please change it!",
        400
      );
    }

    store.password = await bcrypt.hash(newPassword, salt);

    await store.save();
    createResponse(null, 200, "Password has been reset successfully!", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

// authController.setMultipleStoneTypeInProduct = async (req, res, next) => {
//   await productModel.updateMany({}, { $set: { stoneType: "Diamond" } })
// }

authController.refetchUserController = async (req, res, next) => {
  const token = req.store.token;
  jwt.verify(token, config.JWT_SECRET, {}, async (err, data) => {
    if (err) {
      throw new CustomError(err, 404);
    }
    try {
      const id = data._id;
      const store = await StoreModel.findOne({ _id: id });
      createResponse(store, 200, "success", res);

    } catch (error) {
      errorHandler(error, req, res)
    }
  });
};
authController.getRoleOfAuthUser = async (req, res, next) => {
  return createResponse(req.store.role, 200, 'Role get successfully', res);
};

const convertIdToObjectId = (id) => {
  return new mongoose.Types.ObjectId(id.toString());
};

module.exports = {
  convertIdToObjectId,
  FileUpload,
  authController
};
