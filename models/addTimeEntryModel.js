const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const addTimeSchema = new mongoose.Schema(
  {
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

addTimeSchema.add(commonSchema);

const addTimeEntryModel = mongoose.model("addTimeEntryModel", addTimeSchema);

module.exports = addTimeEntryModel;
