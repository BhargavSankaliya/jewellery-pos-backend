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

const itemSchema = new mongoose.Schema(
  {
    diamondShape: {
      type: String,
      required: [true, 'Diamond Shape is required.'],
    },
    diamondShapeImage: {
      type: Array,
      required: [true, 'Diamond Shape Image is required.'],
    },
    goldType: {
      type: String,
      required: [true, 'Gold Type is required.'],
    },
    bandWidth: {
      type: String,
      required: false,
    },

    stocks: {
      type: Number,
      min: 0,
      required: [true, 'Natural Stocks is required.'],
    },
    labGrownStock: {
      type: Number,
      min: 0,
      required: [true, 'Lab Grown Stocks is required.'],
    },
    goldTypeColor: {
      type: String,
      required: [true, 'Gold Type Color is required.'],
    },
    diamondTypeNaturalMRP: {
      type: Number,
      required: [true, 'Diamond Type Natural is required.'],
    },
    diamondTypeLabGrownMRP: {
      type: Number,
      required: [true, 'Diamond Type Lab Grown is required.'],
    },
    files: {
      type: Array,
      required: false,
    },
    videos: {
      type: Array,
      required: false,
    },
  },
  { timestamps: true }
);

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
    // mrp: {
    //   type: Number,
    //   required: [true, 'MRP is required'],
    // },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productCategoryModel",
      required: [true, 'Category is required'],
    },
    subCategory: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
    },
    gender: [{
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, 'Gender is required'],
    }],
    productDisplay: {
      type: String,
      default: false,
      required: [false, 'Product display is required'],
    },
    mostSelling: {
      type: Boolean,
      default: false,
      required: false,
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
    stoneType: {
      type: [String],
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

    items: [itemSchema]

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

module.exports = { productModel, productSchema };
