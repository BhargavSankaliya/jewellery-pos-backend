const mongoose = require("mongoose");
const validator = require("validator");
const commonSchema = require("./CommonModel");
const StoreModel = require("./storeModel");
const { productModel, productSchema } = require("./productModel");

const productsSchemas = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  productDetails: {
    productUniqueNumber: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "productCategoryModel",
      required: false,
    },
    subCategory: {
      type: [mongoose.Schema.Types.ObjectId],
      required: false,
    },
    gender: [{
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
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
      required: false,
    },
    grossWeightName: {
      type: String,
      default: '',
      required: false,
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
    orderNumber: {
      type: String,
      unique: true,
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "machineModel",
      required: [false, 'Machine is required.'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [false, 'Store is required.'],
    },
    products: {
      type: [productsSchemas], // Array of location objects
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
    remark: {
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
    isCancel: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate orderNumber
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${currentDate.getDate().toString().padStart(2, "0")}`;

    try {
      // Fetch the last order for this store
      const lastOrder = await this.constructor
        .findOne({ storeId: this.storeId })
        .sort({ createdAt: -1 });

      let storeWiseNumber = lastOrder ? parseInt(lastOrder.orderNumber.split("-")[1]) + 1 : 1;

      // Ensure storeName is set
      if (!this.storeName) {
        const store = await StoreModel.findById(this.storeId);
        if (store) {
          this.storeName = store.companyName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '').toUpperCase();
        } else {
          throw new Error("Invalid storeId provided.");
        }
      }

      this.orderNumber = `${formattedDate}-${storeWiseNumber}-${this.storeName}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

orderSchema.add(commonSchema);

const OrderModel = mongoose.model("orders", orderSchema);

module.exports = OrderModel;
