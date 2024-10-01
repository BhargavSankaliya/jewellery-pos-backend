const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

// Counter schema for tracking sequence
const counterSchema = new mongoose.Schema({
  _id: String, // Name of the counter (e.g., "machineNameId")
  sequence_value: { type: Number, default: 0, required: false },
  sequence_product_value: { type: Number, default: 0, required: false },
});

const Counter = mongoose.model('deviceNameCounter', counterSchema);

function padWithZeros(number, length) {
  return number.toString().padStart(length, '0'); // Pads the number with leading zeros
}

// Function to get the next unique machineName
async function getNextmachineName() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'machineNameId' },
    { $inc: { sequence_value: 1 } }, // Increment the sequence
    { new: true, upsert: true } // Create document if it doesn't exist
  );

  // Format the sequence number into META000001
  return `META${padWithZeros(counter.sequence_value, 6)}`;
}

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
    deviceNumber: {
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

// Pre-save hook for generating unique machineId and machineName
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

  if (!this.machineName) { // Only generate if machineName is not already set
    const newmachineName = await getNextmachineName(); // Generate the unique META000001 format machineName
    this.machineName = newmachineName;
  }

  next();
});

// Function to generate a random 6-digit number
function generate6DigitNumber() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
}

machineSchema.add(commonSchema);

const MachineModel = mongoose.model("machine", machineSchema);

module.exports = { MachineModel, Counter };
