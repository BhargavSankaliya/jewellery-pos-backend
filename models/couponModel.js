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
    couponId: {
      type: String,
      unique: true,
      required: false
    },
    userEmail: {
      type: String,
      required: false,
      default: ""
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
    minPriceSpend: {
      type: Number,
      required: [true, 'Min Price Spend Required.'],
      default: 0
    },
    startDate: {
      type: Date,
      required: [true, 'Start Date is Required.'],
    },
    endDate: {
      type: Date,
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

// Helper function to generate an 8-character alphanumeric coupon ID
function generateCouponId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let couponId = '';
  for (let i = 0; i < 8; i++) {
    couponId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return couponId;
}

// Pre-save hook to set a unique couponId
couponSchema.pre('save', async function (next) {
  if (!this.couponId) {
    let isUnique = false;
    while (!isUnique) {
      const newCouponId = generateCouponId();
      const existingCoupon = await CouponModel.findOne({ couponId: newCouponId });
      if (!existingCoupon) {
        this.couponId = newCouponId;
        isUnique = true;
      }
    }
  }
  next();
});

const CouponModel = mongoose.model("coupon", couponSchema);

module.exports = CouponModel;
