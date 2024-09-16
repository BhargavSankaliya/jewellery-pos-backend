const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const adsSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["Image", "Video"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      required: true,
      default: "Active"
    },
  },
  { timestamps: true }
);

adsSchema.add(commonSchema);

const AdsModel = mongoose.model("ads", adsSchema);

module.exports = AdsModel;
