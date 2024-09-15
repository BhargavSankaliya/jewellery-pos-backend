const express = require('express');
const {
     RegisterUserController,
     VerifyOtpController,
     LoginUserController,
     LogoutUserController,
     refetchUserController,
     forgotPassword,
     resetPassword,
     ResendOtpController,
     VerifyOtpForUpdatePasswordController,
     updatePasswordAfterVerifyOTP,
     FileUpload,
} = require("../controllers/authController")
const router = express.Router()
const verifyToken = require('../middlewares/verifyToken');
const User = require('../models/User');
const { validateSchema } = require('../models/baseModel');


//REGISTER
router.post("/register", validateSchema(User), RegisterUserController)

//VERIFY OTP
router.post("/verify-otp", VerifyOtpController)

// RESEND OTP
router.get("/resend-otp", ResendOtpController)

//LOGIN
router.post("/login", LoginUserController)

//LOGOUT
router.get("/logout", LogoutUserController)

//FETCH CURRENT USER
router.get("/refetch", refetchUserController)

//FORGET PASSWORD 
router.post('/forgot-password', forgotPassword);

//VERIFY OTP FOR FORGOT PASSWORD 
router.post('/otpVerify-UpdatePassword', VerifyOtpForUpdatePasswordController);

//VERIFY OTP FOR FORGOT PASSWORD 
router.post('/reset-password', updatePasswordAfterVerifyOTP);

//RESET PASSWORD
router.post('/change-password', verifyToken, resetPassword);

//File upload
router.post('/file-upload', FileUpload);




module.exports = router