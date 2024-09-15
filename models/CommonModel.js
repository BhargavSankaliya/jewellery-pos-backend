const mongoose = require("mongoose");

const commonSchema = new mongoose.Schema({
    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        required: false
    },
    deletedAt: {
        type: Date,
        default: Date.now,
        required: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
},
    { timestamps: true });

module.exports = commonSchema;
