const mongoose = require("mongoose");
const commonSchema = require("./CommonModel");

const forceSchema = new mongoose.Schema(
  {
    androidUrl: {
      type: String,
      required: true,
    },
    iosUrl: {
      type: String,
      required: true,
    },
    androidVersionCode: {
      type: String,
      required: true,
    },
    iosVersionCode: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

forceSchema.add(commonSchema);

const forceUpdateModel = mongoose.model("forceUpdateModel", forceSchema);

module.exports = forceUpdateModel;
