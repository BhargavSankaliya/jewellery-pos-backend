const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");
const { Counter } = require("./machineModel");

function padWithZeros(number, length) {
  return number.toString().padStart(length, '0'); // Pads the number with leading zeros
}

// Function to get the next unique machineName
async function getNextmachineName() {
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'machineNameId' },
    { $inc: { sequence_product_value: 1 } }, // Increment the sequence
    { new: true, upsert: true } // Create document if it doesn't exist
  );

  // Format the sequence number into META000001
  return `PRODUCT${padWithZeros(counter.sequence_product_value, 8)}`;
}

const productSchema = new mongoose.Schema(
  {
    productUniqueNumber: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
    },
    description: {
      type: String,
      required: false,
    },
    files: {
      type: Array,
      required: false,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
    },
    actualPrice: {
      type: Number,
      required: [true, 'Actual Price is required'],
    },
    devidation: {
      type: Number,
      default: 0,
      required: [true, 'Devidation is required'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productCategoryModel",
      required: [true, 'Category is required'],
    },
    subCategory: {
      type: String,
      required: false,
    },
    gender: [{
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, 'Gender is required'],
    }],
    stocks: {
      type: Number,
      default: 0,
      required: [true, 'Stock is required'],
    },
    grossWeight: {
      type: Number,
      default: 0,
      required: [true, 'Gross is required'],
    },
    grossWeightName: {
      type: String,
      default: '',
      required: [true, 'Gross Weight Name is required'],
    },
    diaWeight: {
      type: Number,
      default: 0,
      required: false,
    },
    diaWeightName: {
      type: String,
      default: '',
      required: false,
    },
    colorSTWeight: {
      type: Number,
      default: 0,
      required: false,
    },
    colorSTWeightName: {
      type: String,
      default: '',
      required: false,
    },
    stoneColor: {
      type: String,
      default: '',
      required: false,
    },
    mainStoneWeight: {
      type: Number,
      default: 0,
      required: false,
    },
    mainStoneWeightName: {
      type: String,
      default: '',
      required: false,
    },
    diaPcs: {
      type: Number,
      default: 0,
      required: false,
    },
    colorStPcs: {
      type: Number,
      default: 0,
      required: false,
    },
    mainStonePcs: {
      type: Number,
      default: 0,
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
productSchema.pre('save', async function (next) {
  if (!this.productUniqueNumber) { // Only generate if machineName is not already set
    const newmachineName = await getNextmachineName(); // Generate the unique META000001 format machineName
    this.productUniqueNumber = newmachineName;
  }
  next();
});

productSchema.add(commonSchema);

const productModel = mongoose.model("product", productSchema);

module.exports = productModel;
