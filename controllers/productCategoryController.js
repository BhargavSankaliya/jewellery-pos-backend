const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const ProductCategory = require("../models/productCategoryModel.js");
const { convertIdToObjectId } = require("./authController.js");
const productCategoryController = {};

productCategoryController.createupdate = async (req, res, next) => {
  try {
    let { name, image } = req.body;

    if (!name) {
      throw new CustomError("Name is required.", 400);
    }

    if (req.query && !!req.query._id) {
      let category = await ProductCategory.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { name: name, image: image ? image : '' }, { upsert: true })
      createResponse({ category }, 200, "Category Updated Successfully.", res);
      return
    }

    let category = await ProductCategory.create({
      name, image: image ? image : ""
    });

    createResponse({ ...category }, 200, "Category Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.list = async (req, res, next) => {
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
        $project: {
          _id: 1,
          name: 1,
          status: 1,
          image: 1
        }
      }
    ]

    let categoryList = await ProductCategory.aggregate(aggragationQuery);
    if (categoryList.length != 0) {
      createResponse({ categoryList }, 200, "Category list fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.getByCategoryId = async (req, res, next) => {
  try {

    let categoryList = await ProductCategory.findById(req.query._id);
    if (!!categoryList) {
      createResponse({ categoryList }, 200, "Category Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.udpateCatgoryStatus = async (req, res, next) => {
  try {

    let getCategory = await ProductCategory.findById(req.query._id)

    if (!getCategory) {
      throw new CustomError("Category not found.", 400);
    }

    let status = getCategory.status == 'Active' ? 'Inactive' : 'Active'

    await ProductCategory.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}


module.exports = { productCategoryController }
