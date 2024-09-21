const User = require("../models/User");
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
const authController = {}

const FileUpload = async (req, res, next) => {
  try {
    const file = [];
    const configURL = config.URL;

    let cImage = '';
    let adsImage = '';
    let adsVideo = '';
    let storeLogo = '';

    if (req.files && !!req.files.cImage && req.files.cImage.length > 0) {
      req.files.cImage.map((x) => {
        cImage = configURL + x.destination + "/" + x.filename
      })
    }
    else {
      cImage = "";
    }

    if (req.files && !!req.files.adsImage && req.files.adsImage.length > 0) {
      req.files.adsImage.map((x) => {
        adsImage = configURL + x.destination + "/" + x.filename
      })
    }
    else {
      adsImage = '';
    }

    if (req.files && !!req.files.adsVideo && req.files.adsVideo.length > 0) {
      req.files.adsVideo.map((x) => {
        adsVideo = configURL + x.destination + "/" + x.filename
      })
    }
    else {
      adsVideo = '';
    }

    if (req.files && !!req.files.storeLogo && req.files.storeLogo.length > 0) {
      req.files.storeLogo.map((x) => {
        storeLogo = configURL + x.destination + "/" + x.filename
      })
    }
    else {
      storeLogo = '';
    }

    createResponse({ cImage, adsVideo, adsImage, storeLogo }, 200, 'File Upload Successfully.', res)

  } catch (error) {
    errorHandler(error, res, res)
  }
}

// resend otp api
authController.ResendOtpController = async (req, res, next) => {
  try {
    const { storeId } = req.query;

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    const updateObject = {
      otp: otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await StoreModel.findOneAndUpdate({ _id: storeId }, updateObject);

    const store = await StoreModel.findOne({ _id: storeId });

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
        400
      );
    }

    if (!password) {
      throw new CustomError(
        "Password is required for login!",
        400
      );
    }

    let store = await StoreModel.findOne({ email, isDeleted: false });

    if (!store) {
      throw new CustomError("Store not found!", 404);
    }

    const match = await bcrypt.compare(password, store.password);
    if (!match) {
      throw new CustomError("Wrong credentials!", 400);
    }

    const token = jwt.sign({ _id: store._id }, config.JWT_SECRET, {
      expiresIn: "90d",
    });

    store.jwtToken = token;
    store.save();

    let responseObject = {
      name: store.name,
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
    // await sendOTPEmail(email, resetToken, req, res);

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
