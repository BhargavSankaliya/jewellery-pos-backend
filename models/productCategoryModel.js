const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const productCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
    },
    image: {
      type: String,
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

productCategorySchema.add(commonSchema);

const ProductCategory = mongoose.model("productCategory", productCategorySchema);

module.exports = ProductCategory;
