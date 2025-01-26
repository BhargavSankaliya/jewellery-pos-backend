const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const OrderModel = require("../models/orderModel.js");
const { convertIdToObjectId } = require("./authController.js");
const StoreModel = require("../models/storeModel.js");
const { MachineModel } = require("../models/machineModel.js");
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
        $sort: {
          createdAt: -1
        }
      },
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
      {
        $sort: {
          createdAt: -1
        }
      }
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

orderController.dashboardCount = async (req, res, next) => {
  try {

    let orderQuery = [
      {
        $count: "string"
      }
    ]

    let orderList = await OrderModel.aggregate(orderQuery)

    let storeList = await StoreModel.aggregate([
      {
        $count: "string"
      }
    ])

    let machineList = await MachineModel.aggregate([
      {
        $count: "string"
      }
    ])

    let paymentMadeData = await OrderModel.aggregate([
      {
        $group: {
          _id: "null",
          payment: {
            $sum: "$paymentMade"
          }
        }
      }
    ])

    let count = {
      totalOrder: orderList[0].string,
      totalStore: storeList[0].string,
      totalMachine: machineList[0].string,
      totalPayment: paymentMadeData[0].payment,
    }

    createResponse(count, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

orderController.orderChartData = async (req, res, next) => {
  try {

    function getLast7Days() {
      const today = new Date();
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i); // Subtract days
        const formattedDate = date.toLocaleDateString('en-GB'); // Format: DD-MM-YYYY
        dates.push(formattedDate); // Push as DD-MM-YYYY
      }
      return dates;
    }

    const last7Days = getLast7Days();

    let query = [
      {
        $match: {
          createdAt: {
            $gte: new Date(req.body.startDate), // Ensure the correct range
            $lt: new Date(req.body.endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d/%m/%Y", // Format dates as DD-MM-YYYY
              date: "$createdAt"
            }
          },
          count: {
            $sum: 1
          },
          paymentMade: {
            $sum: "$paymentMade"
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
          paymentMade: 1,
        }
      }
    ];

    let result = await OrderModel.aggregate(query);

    const resultMap = result.reduce((acc, curr) => {
      acc[curr.date] = curr.count;
      return acc;
    }, {});
    const resultMapForPayment = result.reduce((acc, curr) => {
      acc[curr.date] = curr.paymentMade;
      return acc;
    }, {});

    // Merge the last 7 days with the results, defaulting missing dates to 0
    const finalResult = last7Days.map(date => ({
      date, // Already in DD-MM-YYYY format
      count: resultMap[date] || 0,
      paymentMade: resultMapForPayment[date] || 0
    }));

    createResponse(finalResult, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

/* Category base order data */
orderController.orderChartCategoryBaseData = async (req, res, next) => {
  try {

    function getLast7Days() {
      const today = new Date();
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i); // Subtract days
        const formattedDate = date.toLocaleDateString('en-GB'); // Format: DD-MM-YYYY
        dates.push(formattedDate); // Push as DD-MM-YYYY
      }
      return dates;
    }

    const last7Days = getLast7Days();

    let query = [
      {
        $match: {
          createdAt: {
            $gte: new Date(req.body.startDate), // Ensure the correct range
            $lt: new Date(req.body.endDate)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d/%m/%Y", // Format dates as DD-MM-YYYY
              date: "$createdAt"
            }
          },
          count: {
            $sum: 1
          },
          paymentMade: {
            $sum: "$paymentMade"
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          count: 1,
          paymentMade: 1,
        }
      }
    ];

    let result = await OrderModel.aggregate(query);

    const resultMap = result.reduce((acc, curr) => {
      acc[curr.date] = curr.count;
      return acc;
    }, {});
    const resultMapForPayment = result.reduce((acc, curr) => {
      acc[curr.date] = curr.paymentMade;
      return acc;
    }, {});

    // Merge the last 7 days with the results, defaulting missing dates to 0
    const finalResult = last7Days.map(date => ({
      date, // Already in DD-MM-YYYY format
      count: resultMap[date] || 0,
      paymentMade: resultMapForPayment[date] || 0
    }));

    createResponse(finalResult, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { orderController }
