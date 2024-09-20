const express = require('express');
const { FileUpload, authController } = require("../controllers/authController")
const router = express.Router()
const verifyToken = require('../middlewares/verifyToken');

// RESEND OTP
router.get("/resend-otp", authController.ResendOtpController)

//LOGIN
router.post("/login", authController.LoginUserController)

//FETCH CURRENT USER
router.get("/refetch", authController.refetchUserController)

//FORGET PASSWORD 
router.post('/forgot-password', authController.forgotPassword);

//VERIFY OTP FOR FORGOT PASSWORD 
router.post('/otpVerify-UpdatePassword', authController.VerifyOtpForUpdatePasswordController);

//VERIFY OTP FOR FORGOT PASSWORD 
router.post('/reset-password', authController.updatePasswordAfterVerifyOTP);

//RESET PASSWORD
router.post('/change-password', verifyToken, authController.resetPassword);

//File upload
router.post('/file-upload', FileUpload);




module.exports = router