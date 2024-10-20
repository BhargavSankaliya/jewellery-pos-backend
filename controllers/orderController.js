const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const OrderModel = require("../models/orderModel.js");
const { convertIdToObjectId } = require("./authController.js");
const orderController = {};

orderController.list = async (req, res, next) => {
  try {

    let condition = {};
    condition["$and"] = [];

    condition["$and"].push({
      isDeleted: false
    });

    if (req.store.role == "Admin") {
      condition["$and"].push({
        "machineDetails.storeId": req.store._id
      });
    }

    let aggragationQuery = [
      {
        $lookup: {
          from: "machines",
          localField: "machineId",
          foreignField: "_id",
          as: "machineDetails",
          pipeline: [
            {
              $lookup: {
                from: "stores",
                localField: "storeId",
                foreignField: "_id",
                as: "storeDetails",
                pipeline: [
                  { $project: commonFilter.storeCommonObject }
                ]
              },
            },
            {
              $unwind: {
                path: "$storeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: commonFilter.machineCommonObject
            }
          ]
        },
      },
      {
        $unwind: {
          path: "$machineDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: condition
      },
    ]

    let orderList = await OrderModel.aggregate(aggragationQuery);
    if (orderList.length != 0) {
      createResponse(orderList, 200, "Ads list fetched successfully.", res);
      return
    }

    createResponse([], 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

orderController.orderDetails = async (req, res, next) => {
  try {

    let condition = {};
    condition["$and"] = [];

    condition["$and"].push({
      isDeleted: false
    });
    condition["$and"].push({
      _id: convertIdToObjectId(req.query.orderId)
    });


    let aggragationQuery = [
      {
        $lookup: {
          from: "machines",
          localField: "machineId",
          foreignField: "_id",
          as: "machineDetails",
          pipeline: [
            {
              $lookup: {
                from: "stores",
                localField: "storeId",
                foreignField: "_id",
                as: "storeDetails",
                pipeline: [
                  { $project: commonFilter.storeCommonObject }
                ]
              },
            },
            {
              $unwind: {
                path: "$storeDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: commonFilter.machineCommonObject
            }
          ]
        },
      },
      {
        $unwind: {
          path: "$machineDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          let: {
            storeId: "$machineDetails.storeId"
          },
          as: "productDetails",
          pipeline: [
            {
              $lookup: {
                from: "stores",
                let: {
                  storeId: "$$storeId"
                },
                as: "storeDetails",
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ["$_id", "$$storeId"]
                      }
                    }
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
              $addFields: {
                devidation: "$storeDetails.devidation",
                storePrice: "$storeDetails.storePrice",
                storeDiscount: "$storeDetails.storeDiscount"
              }
            },
            {
              $addFields: {
                productPrice: {
                  $cond: {
                    if: {
                      $gt: ["$devidation", 0]
                    },
                    then: {
                      $divide: ["$mrp", "$devidation"]
                    },
                    else: "$mrp"
                  }
                }
              }
            },
            {
              $addFields: {
                storeProductPrice: {
                  $cond: {
                    if: {
                      $and: [
                        {
                          $gt: ["$devidation", 0]
                        },
                        {
                          $gt: ["$storePrice", 0]
                        }
                      ]
                    },
                    // Ensure devidation and storePrice > 0
                    then: {
                      $add: [
                        {
                          $multiply: [
                            {
                              $divide: [
                                "$mrp",
                                "$devidation"
                              ]
                            },
                            "$storePrice"
                          ]
                        },
                        "$productPrice"
                      ]
                    },
                    else: {
                      $divide: ["$mrp", "$devidation"]
                    }
                  }
                }
              }
            },
            {
              $addFields: {
                actualPrice: {
                  $cond: {
                    if: {
                      $and: [
                        {
                          $gt: ["$storeDiscount", 0]
                        },
                        {
                          $gt: ["$storeProductPrice", 0]
                        }
                      ]
                    },
                    then: {
                      $subtract: [
                        "$storeProductPrice",
                        {
                          $multiply: [
                            "$storeProductPrice",
                            {
                              $divide: [
                                "$storeDiscount",
                                100
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    else: "$storeProductPrice"
                  }
                }
              }
            },
            {
              $lookup: {
                from: "productcategories",
                localField: "category",
                foreignField: "_id",
                as: "productCategoryDetails",
                pipeline: [
                  {
                    $project: commonFilter.productCategoryObject
                  }
                ]
              }
            },
            {
              $unwind: {
                path: "$productCategoryDetails",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: { ...commonFilter.productObject, storePrice: 1, devidation: 1, storeDiscount: 1, }
            }
          ]
        }
      },
      {
        $match: condition
      },
    ]

    let orderList = await OrderModel.aggregate(aggragationQuery);
    if (orderList.length != 0) {
      createResponse(orderList[0], 200, "Ads list fetched successfully.", res);
      return
    }

    createResponse(null, 400, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { orderController }
