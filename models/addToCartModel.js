const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");

const addToCartSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
        },
        diamondType: {
            type: String,
            enum: ["Natural", "LabGrown"],
            required: true,
        },
        goldTypeColor: {
            type: String,
            required: true,
        },
        goldType: {
            type: String,
            required: true,
        },
        diamondShape: {
            type: String,
            required: true,
        },
        files: {
            type: Array,
            required: true,
        },
        diamondShapeImage: {
            type: Array,
            required: false,
        },
        bandWidth: {
            type: String,
            required: false,
        },
        mrp: {
            type: Number,
            required: true,
        },
        productPrice: {
            type: Number,
            required: true,
        },
        storeProductPrice: {
            type: Number,
            required: true,
        },
        actualPrice: {
            type: Number,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        devidation: {
            type: Number,
            required: true,
        },
        storePrice: {
            type: Number,
            required: true,
        },
        storeDiscount: {
            type: Number,
            required: true,
        },
        devidationForLabGrown: {
            type: Number,
            required: true,
        },
        storePriceForLabGrown: {
            type: Number,
            required: true,
        },
        storeDiscountForLabGrown: {
            type: Number,
            required: true,
        },
        machineId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
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

addToCartSchema.add(commonSchema);

const AddToCartModel = mongoose.model("addToCart", addToCartSchema);

module.exports = AddToCartModel;
