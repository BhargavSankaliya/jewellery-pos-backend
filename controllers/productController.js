const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { convertIdToObjectId } = require("./authController.js");
const productModel = require("../models/productModel.js");
const productController = {};

productController.createUpdateProduct = async (req, res, next) => {
  try {
    req.body.category = convertIdToObjectId(req.body.category);

    if (req.query && !!req.query._id) {
      let productData = await productModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, req.body, { upsert: true })
      createResponse(productData, 200, "Product Updated Successfully.", res);
      return
    }

    let productData = await productModel.create(req.body);

    createResponse(productData, 200, "Product Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.list = async (req, res, next) => {
  try {

    let condition = {};
    condition["$and"] = [];

    condition["$and"].push({
      isDeleted: false
    });

    if (req.query.isActive) {
      condition["$and"].push({
        status: "Active"
      });
    }

    let aggragationQuery = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "category",
          foreignField: "_id",
          as: "productCategoriesDetails",
        },
      },
      {
        $unwind: {
          path: "$productCategoriesDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          categoryName: "$productCategoriesDetails.name",
        },
      },
    ]

    let productList = await productModel.aggregate(aggragationQuery);
    if (productList.length != 0) {
      createResponse(productList, 200, "Ads list fetched successfully.", res);
      return
    }

    createResponse([], 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.getByAdsId = async (req, res, next) => {
  try {

    let productDetails = await productModel.findById(req.query._id);
    if (!!productDetails) {
      createResponse(productDetails, 200, "Ads Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.adsDelete = async (req, res, next) => {
  try {
    let productDelete = await productModel.findOneAndDelete({ _id: convertIdToObjectId(req.query._id) });
    createResponse(productDelete, 200, "Ads deleted successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.updateAdsStatus = async (req, res, next) => {
  try {

    let productDetails = await productModel.findById(req.query._id)

    if (!productDetails) {
      throw new CustomError("Ads not found.", 400);
    }

    let status = productDetails.status == 'Active' ? 'Inactive' : 'Active'

    await productModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { productController }
