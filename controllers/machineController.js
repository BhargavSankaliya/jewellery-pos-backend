const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { convertIdToObjectId } = require("./authController.js");
const { MachineModel } = require("../models/machineModel.js");
const StoreModel = require("../models/storeModel.js");
const machineController = {};

machineController.createupdate = async (req, res, next) => {
  try {
    let { pin, ads, deviceNumber } = req.body;
    let storeObjectId = convertIdToObjectId(req.body.storeId);

    let findStore = await StoreModel.findById(storeObjectId)

    if (!findStore) {
      throw new CustomError("Store is not found.", 400);
    }

    if (!deviceNumber) {
      throw new CustomError("Please enter device number.", 400);
    }
    if (!pin || pin.toString().length != 6) throw new CustomError("Please enter six digit pin.", 400);

    if (req.query && !!req.query._id) {
      let machine = await MachineModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, req.body, { upsert: true })
      createResponse(machine, 200, "Machine Details Updated Successfully.", res);
      return
    }

    let Machine = await MachineModel.create(req.body);

    createResponse(Machine, 200, "Machine Details Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

machineController.list = async (req, res, next) => {
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
    if (req.store.role == 'Admin') {
      condition["$and"].push({
        storeId: req.store._id
      });
    }
    if (req.query.storeId && req.query.storeId != 'null') {
      condition["$and"].push({
        storeId: convertIdToObjectId(req.query.storeId)
      });
    }


    let aggragationQuery = [
      {
        $match: condition
      },

      {
        $project: {
          _id: 1,
          id: "$_id",
          machineId: 1,
          deviceNumber: 1,
          ads: 1,
          pin: 1,
          storeId: 1,
          status: 1,
          machineName: 1
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "storeDetails",
        },
      },
      {
        $unwind: {
          path: "$storeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          companyName: "$storeDetails.companyName",
          storeAddress: "$storeDetails.address",
        },
      },
      {
        $lookup: {
          from: "addtimeentrymodels",
          let: { machineId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$machineId", "$$machineId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }  // 🚀 Only fetch the last activity
          ],
          as: "machineActivity"
        }
      },
      {
        $addFields: {
          lastActivity: {
            $ifNull: [{ $arrayElemAt: ["$machineActivity.createdAt", 0] }, null]
          }
        }
      },
      {
        $addFields: {
          machineStatus: {
            $cond: {
              if: {
                $and: [
                  {
                    $gt: [
                      {
                        $size: { $ifNull: ["$machineActivity", []] }
                      },
                      0
                    ]
                  },
                  // Ensure activity exists
                  {
                    $lte: [
                      {
                        $dateDiff: {
                          startDate: "$lastActivity",
                          endDate: "$$NOW",
                          unit: "minute"
                        }
                      },
                      5
                    ]
                  }
                ]
              },
              then: "Online",
              else: "Offline"
            }
          }
        }
      },
      {
        $project: {
          machineActivity: 0,
          // Exclude machineActivity from output
          lastActivity: 0
        }
      }
    ]

    let machineList = await MachineModel.aggregate(aggragationQuery);
    if (machineList.length != 0) {
      createResponse(machineList, 200, "Machine list fetched successfully.", res);
      return
    }

    createResponse(null, 200, "No machine found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

machineController.getByCategoryId = async (req, res, next) => {
  try {

    let machineDetails = await MachineModel.findById(req.query._id);
    if (!!machineDetails) {
      createResponse(machineDetails, 200, "Machine Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No Machine found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

machineController.udpateCatgoryStatus = async (req, res, next) => {
  try {

    let getMachine = await MachineModel.findById(req.query._id)

    if (!getMachine) {
      throw new CustomError("Category not found.", 400);
    }

    let status = getMachine.status == 'Active' ? 'Inactive' : 'Active'

    await MachineModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}


module.exports = { machineController }
