const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { convertIdToObjectId } = require("./authController.js");
const AdsModel = require("../models/adsModel.js");
const adsController = {};

adsController.createAds = async (req, res, next) => {
  try {
    let { url, type } = req.body;

    if (!url) {
      throw new CustomError("Url is required.", 400);
    }

    let adsCreate = await AdsModel.create({
      url, type
    });

    createResponse({ ...adsCreate }, 200, "Ads Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

adsController.list = async (req, res, next) => {
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
          type: 1,
          status: 1,
          url: 1
        }
      }
    ]

    let adsList = await AdsModel.aggregate(aggragationQuery);
    if (adsList.length != 0) {
      createResponse(adsList, 200, "Ads list fetched successfully.", res);
      return
    }

    createResponse([], 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

adsController.getByAdsId = async (req, res, next) => {
  try {

    let adsList = await AdsModel.findById(req.query._id);
    if (!!adsList) {
      createResponse(adsList, 200, "Ads Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

adsController.adsDelete = async (req, res, next) => {
  try {
    let adsList = await AdsModel.findOneAndDelete({ _id: convertIdToObjectId(req.query._id) });
    createResponse(adsList, 200, "Ads deleted successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

adsController.updateAdsStatus = async (req, res, next) => {
  try {

    let getAds = await AdsModel.findById(req.query._id)

    if (!getAds) {
      throw new CustomError("Ads not found.", 400);
    }

    let status = getAds.status == 'Active' ? 'Inactive' : 'Active'

    await ProductCategory.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { adsController }
