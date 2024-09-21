const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");


const machineSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storeModel",
      required: [true, 'Store is required.'],
    },
    pin: {
      type: Number,
      required: [true, 'PIN is required.'],
    },
    ads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "adsModel",
      required: false,
    }],
    machineNumber: {
      type: String,
      required: false,
    },
    machineName: {
      type: String,
      required: false,
    },
    machineId: {
      type: String,
      unique: true,
      required: false,
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

function generate6DigitNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
}

machineSchema.pre('save', async function (next) {
  if (!this.machineId) { // Only generate if machineId is not already set
    let isUnique = false;
    while (!isUnique) {
      const newMachineId = generate6DigitNumber(); // Generate a 6-digit number
      const existingMachine = await this.constructor.findOne({ machineId: newMachineId });
      if (!existingMachine) {
        this.machineId = newMachineId; // Assign the unique machineId
        isUnique = true;
      }
    }
  }
  next();
});

machineSchema.add(commonSchema);

const MachineModel = mongoose.model("machine", machineSchema);

module.exports = MachineModel;
