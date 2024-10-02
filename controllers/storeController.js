const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { convertIdToObjectId } = require("./authController.js");
const AdsModel = require("../models/adsModel.js");
const StoreModel = require("../models/storeModel.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const storeController = {};

storeController.createUpdateStore = async (req, res, next) => {
  try {

    let { name, logo, address, description, email, phone, password, gstNumber, instagramUrl, facebookUrl, youtubeUrl, twitterUrl, locations, jobTitle, businessType, theme, color, companyName, companyWebsite } = req.body;



    if (req.query._id) {
      const storeId = convertIdToObjectId(req.query._id);
      let StoreUpdate = await StoreModel.findOneAndUpdate({ _id: storeId }, req.body, { upsert: true })
      return createResponse(null, 200, "Store Updated Successfully.", res);
    }

    const findStore = await StoreModel.findOne({ email, isDeleted: false });

    if (!!findStore) {
      if (findStore.email === email) {
        throw new CustomError("Email already exists!", 400);
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(password, salt);

    let storeData = req.body;
    storeData.password = hashedPassword

    let storeCreated = await StoreModel.create(
      storeData
    );

    createResponse(null, 200, "Store Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

storeController.list = async (req, res, next) => {
  try {

    let storeCommonObject = await commonFilter.storeCommonObject;

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
        $project: storeCommonObject
      }
    ]

    let storeList = await StoreModel.aggregate(aggragationQuery);
    if (storeList.length != 0) {
      return createResponse(storeList, 200, "Store list fetched successfully.", res);
    }

    return createResponse([], 200, "No store found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

storeController.getByAdsId = async (req, res, next) => {
  try {

    let storeDetails = await StoreModel.findById(req.query._id);
    if (!!storeDetails) {
      createResponse(storeDetails, 200, "Store Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No store found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

storeController.adsDelete = async (req, res, next) => {
  try {
    let adsList = await AdsModel.findOneAndDelete({ _id: convertIdToObjectId(req.query._id) });
    createResponse(adsList, 200, "Ads deleted successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

storeController.updateStoreStatus = async (req, res, next) => {
  try {

    let getStoreDetails = await StoreModel.findById(req.query._id)

    if (!getStoreDetails) {
      throw new CustomError("Store not found.", 400);
    }

    let status = getStoreDetails.status == 'Active' ? 'Inactive' : 'Active'

    await StoreModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { storeController }
