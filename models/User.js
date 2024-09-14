const mongoose = require("mongoose");
const validator = require("validator");
const moment = require("moment")

function parseDateOfBirth(dateString) {
  const parsedDate = new Date(dateString);
  return parsedDate;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      validate: {
        validator: function (value) {
          return validator.isMobilePhone(value, "any", { strictMode: true });
        },
        message: "Please provide a valid phone number",
      },
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (value) {
          return (
            validator.isAlphanumeric(value) &&
            validator.isLength(value, { min: 3, max: 20 })
          );
        },
        message:
          "Username must be alphanumeric and between 3 to 20 characters long",
      },
      index: 'text'
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
      index: 'text'
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
      index: 'text'
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
    },
    dateOfbirth: {
      type: Date,
      default: null,
      set: function (value) {
        if (typeof value === "string") {
          try {
            return parseDateOfBirth(value);
          } catch (error) {
            console.error('Error parsing date of birth:', error);
            return null;
          }
        }
        return value;
      },
      validate: {
        validator: function (value) {
          if (!value) return true;
          return moment.isDate(value);
        },
        message: "Invalid date of birth",
      },
    },
    deviceId: {
      type: String,
      default: "",
    },
    deviceName: {
      type: String,
      default: "",
    },
    fcmToken: {
      type: String,
      default: "",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      index: 'text',
      default: '',
      required: false
    },
    businessType: {
      type: String,
      trim: true,
      default: '',
      required: false
    },
    location: {
      type: String,
      trim: true,
      default: '',
      required: false
    },
    profilePicture: {
      type: String,
      default: "",
    },
    coverPicture: {
      type: String,
      default: "",
    },
    blockList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedByList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
      },
    ],
    followedHashtags: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hashtag'
    }],
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
    },
    resetPasswordTokenVerify: {
      type: Boolean,
      default: false,
    },
    jwtToken: {
      type: String,
      default: "",
      required: false
    },
    status: {
      type: String,
      enum: ["offline", "online"],
      required: false,
      default: 'offline'
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
