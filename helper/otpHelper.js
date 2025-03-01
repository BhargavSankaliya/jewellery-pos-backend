const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require("../environmentVariable.json");
const { errorHandler } = require('../middlewares/error');

const sendOTPEmail = async (email, otp, req, res) => {

    try {
        const transporter = nodemailer.createTransport({
            host: config.HOST,
            port: config.emailPORT,
            secure: config.SECURE,
            auth: {
                user: config.AUTHUSER,
                pass: config.AUTHPASSWORD
            }
        });
        const mailOptions = {
            from: config.AUTHUSER,
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        errorHandler(error, req, res)
    }

};

const sendEmailForUser = async (data, req, res) => {

    try {
        const transporter = nodemailer.createTransport({
            host: config.HOST,
            port: config.emailPORT,
            secure: config.SECURE,
            auth: {
                user: config.AUTHUSER,
                pass: config.AUTHPASSWORD
            }
        });
        const mailOptions = {
            from: config.AUTHUSER,
            to: data.email,
            subject: 'Order',
            text: `Your order has been placed. Order ID : ${data.orderId}`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        errorHandler(error, req, res)
    }

};

const sendEmailForMeta = async (data, req, res) => {

    try {
        const transporter = nodemailer.createTransport({
            host: config.HOST,
            port: config.emailPORT,
            secure: config.SECURE,
            auth: {
                user: config.AUTHUSER,
                pass: config.AUTHPASSWORD
            }
        });
        const mailOptions = {
            from: config.AUTHUSER,
            to: "metajewelryproduct@gmail.com",
            subject: data.firstname + " " + data.lastname + " Create order",
            text: `${data.firstname} ${data.lastname} has create new order. Order ID : ${data.orderId}`
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        errorHandler(error, req, res)
    }

};


const sendOTPPhone = async (phoneNumber, otp, req, res) => {
    try {
        const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

        await client.messages.create({
            body: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
            from: 'your-twilio-number',
            to: phoneNumber
        });
    } catch (error) {
        errorHandler(error, req, res)
    }

};

module.exports = { sendOTPEmail, sendOTPPhone, sendEmailForUser, sendEmailForMeta };
