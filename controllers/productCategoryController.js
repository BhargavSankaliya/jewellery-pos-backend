const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const ProductCategory = require("../models/productCategoryModel.js");
const { convertIdToObjectId } = require("./authController.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const productCategoryController = {};

productCategoryController.createupdate = async (req, res, next) => {
  try {
    let { name, image } = req.body;

    if (!name) {
      throw new CustomError("Name is required.", 400);
    }

    if (req.query && !!req.query._id) {
      let category = await ProductCategory.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { name: name, image: image ? image : '', order: req.body.order, parentCategory: req.body.parentCategory ? convertIdToObjectId(req.body.parentCategory) : null }, { upsert: true })
      createResponse({ category }, 200, "Category Updated Successfully.", res);
      return
    }

    let category = await ProductCategory.create({
      name, image: image ? image : "", order: req.body.order, parentCategory: req.body.parentCategory ? convertIdToObjectId(req.body.parentCategory) : null
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
          image: 1,
          order: 1,
          parentCategory: 1,
        }
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "parentCategory",
          foreignField: "_id",
          as: "parentCategoryDetails"
        }
      },
      {
        $unwind: {
          path: "$parentCategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          parentCategoryName:
            "$parentCategoryDetails.name"
        }
      },
      {
        $sort: {
          order: 1
        }
      }
    ]

    let categoryList = await ProductCategory.aggregate(aggragationQuery);
    if (categoryList.length != 0) {
      createResponse(categoryList, 200, "Category list fetched successfully.", res);
      return
    }

    createResponse(null, 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.parentCategory = async (req, res, next) => {
  try {

    let categoryPipeline = [
      {
        $match: {
          isDeleted: false,
          status: 'Active',
          parentCategory: null
        }
      },
      {
        $project: commonFilter.productCategoryObject
      },
      {
        $sort: {
          order: 1
        }
      }
    ]

    let getAllCategories = await ProductCategory.aggregate(categoryPipeline);
    if (!getAllCategories || getAllCategories.length == 0) {
      return createResponse([], 200, "categories fetched successfully", res)
    }
    return createResponse(getAllCategories, 200, "categories fetched successfully", res)
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.subCategory = async (req, res, next) => {
  try {

    let categoryPipeline = [
      {
        $match: {
          isDeleted: false,
          status: 'Active',
          parentCategory: {
            $ne: null
          }
        }
      },
      {
        $project: commonFilter.productCategoryObject
      },
      {
        $sort: {
          order: 1
        }
      }
    ]

    let getAllCategories = await ProductCategory.aggregate(categoryPipeline);
    if (!getAllCategories || getAllCategories.length == 0) {
      return createResponse([], 200, "sub categories fetched successfully", res)
    }
    return createResponse(getAllCategories, 200, "sub categories fetched successfully", res)
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productCategoryController.getByCategoryId = async (req, res, next) => {
  try {

    let categoryList = await ProductCategory.findById(req.query._id);
    if (!!categoryList) {
      createResponse(categoryList, 200, "Category Details fetched successfully.", res);
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
