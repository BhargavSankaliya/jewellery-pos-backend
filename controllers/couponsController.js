const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const CouponModel = require("../models/couponModel.js");
const OrderModel = require("../models/orderModel.js");
const StoreModel = require("../models/storeModel.js");
const { convertIdToObjectId } = require("./authController.js");
const couponsController = {};

couponsController.createCoupons = async (req, res, next) => {
  try {
    let { name, description, discount, minOrderRequired, startDate, endDate, remainingCount } = req.body;

    const getStoreId = [
      {
        $lookup: {
          from: "machines",
          localField: "_id",
          foreignField: "storeId",
          as: "machineDetails"
        }
      },
      {
        $unwind: {
          path: "$machineDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "orders",
          localField: "machineDetails._id",
          foreignField: "machineId",
          as: "orderDetails"
        }
      },
      {
        $project: {
          _id: 1,
          storeCount: {
            $size: "$orderDetails"
          }
        }
      },
      {
        $group: {
          _id: "$_id",
          storeCount: {
            $sum: "$storeCount"
          }
        }
      },
      {
        $match: {
          $expr: {
            $gte: ["$storeCount", parseInt(minOrderRequired)]
          }
        }
      }
    ]

    let getStoreDetailsOfOrder = await StoreModel.aggregate(getStoreId);

    let createCouponOfStore = [];

    if (getStoreDetailsOfOrder && getStoreDetailsOfOrder.length > 0) {
      getStoreDetailsOfOrder.map((x) => {
        createCouponOfStore.push({ ...req.body, storeId: x._id })
      })
    }

    if (createCouponOfStore.length > 0) {
      let couponsCreate = await CouponModel.insertMany(createCouponOfStore);
      return createResponse(null, 200, "Coupon Created Successfully.", res);
    }
    else {
      return createResponse(null, 400, "No Store Found for this coupon.", res);
    }


  } catch (error) {

    errorHandler(error, req, res)

  }
}

// couponsController.list = async (req, res, next) => {
//   try {

//     let condition = {};
//     condition["$and"] = [];

//     condition["$and"].push({
//       isDeleted: false
//     });

//     if (req.query.isActive) {
//       condition["$and"].push({
//         status: "Active"
//       });
//     }

//     let aggragationQuery = [
//       {
//         $match: condition
//       },
//       {
//         $project: {
//           _id: 1,
//           type: 1,
//           status: 1,
//           url: 1
//         }
//       }
//     ]

//     let adsList = await AdsModel.aggregate(aggragationQuery);
//     if (adsList.length != 0) {
//       createResponse(adsList, 200, "Ads list fetched successfully.", res);
//       return
//     }

//     createResponse([], 200, "No category found.", res);
//   } catch (error) {
//     errorHandler(error, req, res)
//   }
// }

// couponsController.getByAdsId = async (req, res, next) => {
//   try {

//     let adsList = await AdsModel.findById(req.query._id);
//     if (!!adsList) {
//       createResponse(adsList, 200, "Ads Details fetched successfully.", res);
//       return
//     }

//     createResponse(null, 404, "No category found.", res);
//   } catch (error) {
//     errorHandler(error, req, res)
//   }
// }

// couponsController.adsDelete = async (req, res, next) => {
//   try {
//     let adsList = await AdsModel.findOneAndDelete({ _id: convertIdToObjectId(req.query._id) });
//     createResponse(adsList, 200, "Ads deleted successfully.", res);
//   } catch (error) {
//     errorHandler(error, req, res)
//   }
// }

// couponsController.updateAdsStatus = async (req, res, next) => {
//   try {

//     let getAds = await AdsModel.findById(req.query._id)

//     if (!getAds) {
//       throw new CustomError("Ads not found.", 400);
//     }

//     let status = getAds.status == 'Active' ? 'Inactive' : 'Active'

//     await AdsModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

//     createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
//   } catch (error) {
//     errorHandler(error, req, res)
//   }
// }

module.exports = { couponsController }
