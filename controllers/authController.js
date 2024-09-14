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

// User Registartion API
const RegisterUserController = async (req, res, next) => {
  try {

    const {
      email,
      phoneNumber,
      password,
      username,
      deviceId,
      deviceName,
      fcmToken,
      isAdmin,
      firstName,
      lastName,
      isVerified,
    } = req.body;

    let profilePicture = "";
    if (req.files.profilePicture && req.files.profilePicture.length > 0) {
      profilePicture = config.URL + req.files.profilePicture[0].destination + "/" + req.files.profilePicture[0].filename;
    }

    if (!!req.body.profilePicture) {
      profilePicture = req.body.profilePicture
    }


    let query = [
      {
        $match: {
          $and: [
            {
              isDeleted: false
            },
            {
              $or: [
                {
                  email: email
                },
                {
                  phoneNumber: phoneNumber
                },
                {
                  username: username
                }
              ]
            }
          ]
        }
      }
    ]

    const findUser = await User.aggregate(query);

    if (findUser.length > 0) {
      const findedUser = findUser[0];
      if (findedUser.email === email) {
        throw new CustomError("Email already exists!", 400);
      }
      if (findedUser.phoneNumber === phoneNumber) {
        throw new CustomError("Phone number already exists!", 400);
      }
      if (findedUser.username === username) {
        throw new CustomError("Username already exists!", 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    const newUser = new User({
      email,
      phoneNumber,
      password: hashedPassword,
      profilePicture: profilePicture,
      username,
      deviceId,
      deviceName,
      firstName,
      lastName,
      fcmToken,
      isAdmin: isAdmin || false,
      isVerified: isVerified || false,
      otp: otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const savedUser = await newUser.save();

    const newUserFollow = new Follow({
      userId: savedUser._id,
      following: [],
      followers: [],
      requestFollow: [],
    });

    await newUserFollow.save();

    console.log("Follow document created for user:", savedUser._id);

    const token = jwt.sign({ _id: savedUser._id }, config.JWT_SECRET, {
      expiresIn: "90d",
    });

    newUser.jwtToken = token;
    newUser.save();

    if (email) {
      await sendOTPEmail(email, otpCode, req, res);
    } else if (phoneNumber) {
      await sendOTPPhone(phoneNumber, otpCode, req, res);
    }
    createResponse(savedUser, 200, "User registered successfully. Please verify your email/phone using the OTP sent.", res);
  } catch (error) {
    // next(error);
    errorHandler(error, req, res)
  }
};

const FileUpload = async (req, res, next) => {
  try {
    const file = [];
    const configURL = config.productionURL;

    let profilePicture = "";
    let pimage = [];
    let pvideo = [];

    if (req.files && !!req.files.profilePicture && req.files.profilePicture.length > 0) {
      req.files.profilePicture.map((x) => {
        profilePicture = configURL + x.destination + "/" + x.filename
      })
    }
    else {
      profilePicture = "";
    }

    if (req.files && !!req.files.pimage && req.files.pimage.length > 0) {
      req.files.pimage.map((x) => {
        pimage.push(configURL + x.destination + "/" + x.filename)
      });
    }
    else {
      pimage = []
    }

    if (req.files && !!req.files.pvideo && req.files.pvideo.length > 0) {
      req.files.pvideo.map(
        (x) => pvideo.push(configURL + x.destination + "/" + x.filename)
      );
    }
    else {
      pvideo = []
    }

    createResponse({ profilePicture, pimage, pvideo }, 200, 'File Upload Successfully.', res)

  } catch (error) {
    errorHandler(error, res, res)
  }
}

//  Verify OTP API
const VerifyOtpController = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findOne({ _id: userId, otp });

    if (!user || new Date() > user.otpExpiresAt) {
      throw new CustomError("Invalid or expired OTP.", 400);
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined; // Clear the OTP
    user.otpExpiresAt = undefined; // Clear the OTP expiration

    await user.save();
    createResponse(null, 200, "OTP verified successfully. Your account is now verified.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// resend otp api
const ResendOtpController = async (req, res, next) => {
  try {
    const { userId } = req.query;

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    const updateObject = {
      otp: otpCode,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    };

    await User.findOneAndUpdate({ _id: userId }, updateObject);

    const user = await User.findOne({ _id: userId });

    if (user.email) {
      await sendOTPEmail(user.email, otpCode, req, res);
    } else if (user.phoneNumber) {
      await sendOTPPhone(user.phoneNumber, otpCode, req, res);
    }

    createResponse(null, 200, "Please verify your email/phone using the OTP resent.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Login API
const LoginUserController = async (req, res, next) => {
  try {
    const { email, phoneNumber, password, deviceId, deviceName, fcmToken } = req.body;

    if (!deviceId || !deviceName || !fcmToken) {
      throw new CustomError(
        "Please add FCM token details!",
        400
      );
    }

    if (!email && !phoneNumber) {
      throw new CustomError(
        "Email or phone number is required for login!",
        400
      );
    }

    if (!password) {
      throw new CustomError(
        "Password is required for login!",
        400
      );
    }

    let user;

    if (email) {
      user = await User.findOne({ email });
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
    }

    if (!user) {
      throw new CustomError("User not found!", 404);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new CustomError("Wrong credentials!", 401);
    }

    let updateObject = {
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
      fcmToken: req.body.fcmToken,
    };

    await User.findOneAndUpdate({ _id: user._id }, updateObject);

    if (email) {
      user = await User.findOne({ email });
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
    }

    const { password: userPassword, ...userData } = user._doc;

    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "90d",
    });

    user.jwtToken = token;
    user.save();

    createResponse({ ...userData, token }, 200, "Login Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Logout API
const LogoutUserController = async (req, res, next) => {
  try {
    createResponse(null, 200, "User logged out successfully!", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Forget Password API
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new CustomError("Email is required!", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new CustomError("User not found!", 404);
    }

    const resetToken = Math.floor(100000 + Math.random() * 900000);
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // const resetUrl = `${config.URL}/reset-password?token=${resetToken}`;
    await sendOTPEmail(email, resetToken, req, res);

    createResponse({ userId: user._id }, 200, "Please verify your OTP for update password!", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

//  Verify OTP API
const VerifyOtpForUpdatePasswordController = async (req, res, next) => {
  try {
    const { userId, resetPasswordToken } = req.body;

    const user = await User.findOne({ _id: userId, resetPasswordToken });

    if (!user || new Date() > user.resetPasswordExpiry) {
      throw new CustomError("Invalid or expired OTP.", 400);
    }

    // Mark user as verified
    user.resetPasswordToken = undefined; // Clear the OTP
    user.resetPasswordExpiry = undefined; // Clear the OTP expiration
    user.resetPasswordTokenVerify = true;

    await user.save();

    createResponse({ userId: userId }, 200, "OTP verified successfully.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

//  Verify OTP API
const updatePasswordAfterVerifyOTP = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    if (!password) {
      throw new CustomError("Password is required!", 400);
    }

    const user = await User.findOne({
      _id: userId,
      resetPasswordTokenVerify: true,
    });

    if (!user) {
      throw new CustomError("Please Verify OTP!", 400);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordTokenVerify = false;

    await user.save();
    createResponse(null, 200, "Password has been reset successfully!", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
};

// Reset Password Controller
const resetPassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    if (!password) {
      throw new CustomError("Password is required!", 400);
    }
    if (!newPassword) {
      throw new CustomError("New Password is required!", 400);
    }

    const user = req.user;

    const salt = await bcrypt.genSalt(10);
    const oldPassword = await bcrypt.hash(password, salt);
    if (user.password != oldPassword) {
      throw new CustomError("Password is not Match!", 400);
    }

    if (password == newPassword) {
      throw new CustomError(
        "Old Password and New Password is Match, Please change it!",
        400
      );
    }

    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    createResponse(null, 200, "Password has been reset successfully!", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
};

const refetchUserController = async (req, res, next) => {
  const token = req.cookies.token;
  jwt.verify(token, config.JWT_SECRET, {}, async (err, data) => {
    if (err) {
      throw new CustomError(err, 404);
    }
    try {
      const id = data._id;
      const user = await User.findOne({ _id: id });
      createResponse(user, 200, "success", res);

    } catch (error) {
      errorHandler(error, req, res)
    }
  });
};

const convertIdToObjectId = (id) => {
  return new mongoose.Types.ObjectId(id.toString());
};

module.exports = {
  RegisterUserController,
  VerifyOtpController,
  ResendOtpController,
  LoginUserController,
  LogoutUserController,
  refetchUserController,
  forgotPassword,
  resetPassword,
  convertIdToObjectId,
  VerifyOtpForUpdatePasswordController,
  updatePasswordAfterVerifyOTP,
  FileUpload
};
