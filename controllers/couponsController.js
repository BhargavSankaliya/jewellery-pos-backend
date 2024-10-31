const { commonFilter } = require("../middlewares/commonFilter.js");
const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const CouponModel = require("../models/couponModel.js");
const OrderModel = require("../models/orderModel.js");
const StoreModel = require("../models/storeModel.js");
const { convertIdToObjectId } = require("./authController.js");
const couponsController = {};

couponsController.createCouponForStoreList = async (req, res, next) => {
  try {
    if (req.store.role == 'Admin') {
      const getUserDetails = [
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
          $unwind: {
            path: "$orderDetails",
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $project: {
            storeId: "$_id",
            _id: 0,
            firstname: "$orderDetails.firstname",
            lastname: "$orderDetails.lastname",
            phone: "$orderDetails.phone",
            email: "$orderDetails.email"
          }
        },
        {
          $group: {
            _id: {
              storeId: "$storeId",
              email: "$email"
            },
            storeId: {
              $first: "$storeId"
            },
            email: {
              $first: "$email"
            },
            emailCount: {
              $sum: 1
            },
            lastname: {
              $first: "$lastname"
            },
            firstname: {
              $first: "$firstname"
            },
            phone: {
              $first: "$phone"
            }
          }
        },
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: ["$emailCount", parseInt(req.query.minOrderRequired)]
                },
                {
                  $gte: ["$storeId", req.store._id]
                }
              ]
            }
          }
        }
      ];

      let getUserDetailsForCoupon = await StoreModel.aggregate(getUserDetails);

      if (getUserDetailsForCoupon && getUserDetailsForCoupon.length > 0) {
        return createResponse(getUserDetailsForCoupon, 200, "User details get successfully.", res);
      }
      else {
        return createResponse([], 200, "User details get successfully.", res);
      }
    }
    else {
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
            storeCount: {
              $size: "$orderDetails"
            },
            ...commonFilter.storeCommonObject
          }
        },
        {
          $group: {
            _id: "$_id",
            storeCount: {
              $sum: "$storeCount"
            },
            storeName: { $first: "$storeName" },
            logo: { $first: "$logo" },
            address: { $first: "$address" },
            pincode: { $first: "$pincode" },
            country: { $first: "$country" },
            state: { $first: "$state" },
            city: { $first: "$city" },
            description: { $first: "$description" },
            gstNumber: { $first: "$gstNumber" },
            phone: { $first: "$phone" },
            email: { $first: "$email" },
            instagramUrl: { $first: "$instagramUrl" },
            facebookUrl: { $first: "$facebookUrl" },
            youtubeUrl: { $first: "$youtubeUrl" },
            twitterUrl: { $first: "$twitterUrl" },
            jobTitle: { $first: "$jobTitle" },
            businessType: { $first: "$businessType" },
            companyName: { $first: "$companyName" },
            theme: { $first: "$theme" },
            color: { $first: "$color" },
            companyWebsite: { $first: "$companyWebsite" },
            locations: { $first: "$locations" },
            status: { $first: "$status" },
            role: { $first: "$role" }
          }
        },
        {
          $match: {
            $expr: {
              $gte: ["$storeCount", parseInt(req.query.minOrderRequired)]
            }
          }
        }
      ]

      let getStoreDetailsOfOrder = await StoreModel.aggregate(getStoreId);

      if (getStoreDetailsOfOrder && getStoreDetailsOfOrder.length > 0) {
        return createResponse(getStoreDetailsOfOrder, 200, "Store list fetched Successfully.", res);
      }
      else {
        return createResponse([], 200, "Store list fetched Successfully.", res);
      }
    }


  } catch (error) {
    errorHandler(error, req, res, next)
  }
}


couponsController.createCoupons = async (req, res, next) => {
  try {
    let bodyData = req.body;

    if (bodyData.length > 0) {
      let couponsCreate = await Promise.all(
        bodyData.map(data => CouponModel.create(data))
      );
      return createResponse(null, 200, "Coupon Created Successfully.", res);
    }
    else {
      return createResponse(null, 400, "No Store Found for this coupon.", res);
    }
  } catch (error) {
    errorHandler(error, req, res)
  }
}

couponsController.list = async (req, res, next) => {
  try {

    let condition = {};
    condition["$and"] = [];

    condition["$and"].push({
      isDeleted: false
    });

    if (req.store.role == 'Admin') {
      condition["$and"].push({
        storeId: convertIdToObjectId(req.store._id)
      });
    }

    let aggragationQuery = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: "stores",
          localField: "storeId",
          foreignField: "_id",
          as: "storeDetails",
          pipeline: [
            {
              $project: commonFilter.storeCommonObject
            }
          ]
        }
      },
      {
        $unwind: {
          path: "$storeDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: commonFilter.couponObject
      }
    ]

    let couponList = await CouponModel.aggregate(aggragationQuery);
    if (couponList.length != 0) {
      createResponse(couponList, 200, "Coupon list fetched successfully.", res);
      return
    }

    createResponse([], 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

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

couponsController.couponDelete = async (req, res, next) => {
  try {
    let adsList = await CouponModel.findByIdAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { isDeleted: true });
    createResponse(adsList, 200, "Coupon deleted successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

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
