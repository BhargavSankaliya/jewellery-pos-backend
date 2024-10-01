const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, 'Location address is required.'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required.'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required.'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required.'],
    trim: true
  },
  pinCode: {
    type: String,
    required: [true, 'Pincode is required.'],
    trim: true
  }
});

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is requied.'],
      trim: true,
      default: ''
    },
    logo: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Address is required.'],
      trim: true,
      default: ''
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    gstNumber: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    theme: {
      type: String,
      required: false,
    },
    color: {
      type: String,
      required: false,
    },
    jobTitle: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    businessType: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    companyName: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    companyWebsite: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    phone: {
      type: Array,
      default: []
    },
    email: {
      type: String,
      required: [true, 'Email is requied.'],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email!`
      },
      default: ''
    },
    password: {
      type: String,
      required: [false, 'Password is required.'],
    },
    instagramUrl: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    facebookUrl: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    youtubeUrl: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    twitterUrl: {
      type: String,
      required: false,
      trim: true,
      default: ''
    },
    locations: {
      type: [locationSchema], // Array of location objects
      require: false,
      default: []
    },
    role: {
      type: String,
      enum: ["Admin", "SuperAdmin"],
      required: true,
      default: "Admin"
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      required: true,
      default: "Active"
    },
    resetPasswordToken: {
      type: Number,
      default: '',
      required: false
    },
    resetPasswordTokenVerify: {
      type: Boolean,
      default: false,
      required: false
    },
    resetPasswordExpiry: {
      type: Date,
      default: '',
      required: false
    },
    otp: {
      type: Number,
      default: '',
      required: false
    },
    otpExpiresAt: {
      type: Date,
      default: '',
      required: false
    },
    jwtToken: {
      type: String,
      default: '',
      required: false
    },
  },
  { timestamps: true }
);

storeSchema.add(commonSchema);

const StoreModel = mongoose.model("stores", storeSchema);

module.exports = StoreModel;
