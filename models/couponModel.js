const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const couponSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "storeModel",
      required: [false, 'Store is required.'],
    },
    name: {
      type: String,
      required: [true, 'Name is Required.'],
    },
    description: {
      type: String,
      required: false,
    },
    discount: {
      type: Number,
      required: [true, 'Discount is Required.'],
    },
    minOrderRequired: {
      type: Number,
      required: [true, 'Min Order Required.'],
      default: 0
    },
    startDate: {
      type: Number,
      required: [true, 'Start Date is Required.'],
    },
    endDate: {
      type: Number,
      required: [true, 'End Date is Required.'],
    },  
    usageCount: {
      type: Number,
      required: true,
      default: 0
    },
    remainingCount: {
      type: Number,
      required: [true, 'Remaining Usage is Required.'],
      default: 0
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

couponSchema.add(commonSchema);

const CouponModel = mongoose.model("coupon", couponSchema);

module.exports = CouponModel;
