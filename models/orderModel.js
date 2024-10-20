const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const productsSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "productModel",
    required: [true, 'Product is required.'],
  },
  quantity: {
    type: Number,
    default: 0,
    required: [true, 'Quantity is required.'],
  }
});

const orderSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      default: 'Meta',
      required: [false, "First Name is required."],
      trim: true,
    },
    lastname: {
      type: String,
      default: 'Jewels',
      required: [false, "Last Name is required."],
      trim: true,
    },
    email: {
      type: String,
      default: 'metajewelryproduct@gmail.com',
      required: [false, "Email is required."],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email!`
      },
    },
    phone: {
      type: String,
      required: false,
      default: "+918989898989"
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "machineModel",
      required: [false, 'Machine is required.'],
    },
    products: {
      type: [productsSchema], // Array of location objects
      require: true,
      default: []
    },
    paymentMade: {
      type: Number,
      required: false,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Not Paid", "Deposited"],
      required: true,
      default: "Paid"
    },
    paymentMode: {
      type: String,
      enum: ["Card", "Cash"],
      required: true,
      default: "Cash"
    },
    cardReferenceNumber: {
      type: String,
      required: false,
      default: ""
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

orderSchema.add(commonSchema);

const OrderModel = mongoose.model("orders", orderSchema);

module.exports = OrderModel;
