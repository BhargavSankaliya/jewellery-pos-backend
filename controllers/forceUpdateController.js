const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const forceUpdateModel = require("../models/forceUpdateModel.js");
const { convertIdToObjectId } = require("./authController.js");
const forceUpdateController = {};

forceUpdateController.createUpdate = async (req, res, next) => {
  try {

    let data = await forceUpdateModel.aggregate([{ $match: { isDeleted: false } }]);

    if (!data || data.length == 0) {
      await forceUpdateModel.create(req.body)
    }
    else {
      await forceUpdateModel.findOneAndUpdate({ _id: data[0]._id }, req.body);
    }

    createResponse({ success: true }, 200, "Force Updated Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

forceUpdateController.list = async (req, res, next) => {
  try {

    let forceDetails = await forceUpdateModel.aggregate([{ $match: { isDeleted: false } }]);
    if (forceDetails.length != 0) {
      createResponse(forceDetails[0], 200, "Fetched.", res);
      return
    }

    createResponse(null, 200, "Fetched.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { forceUpdateController }
