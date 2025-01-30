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
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails",
          pipeline: [
            { $project: commonFilter.productObject }
          ]
        },
      },
      {
        $addFields: {
          productDetails: {
            $map: {
              input: "$productDetails",
              as: "cat",
              in: {
                $mergeObjects: [
                  "$$cat",
                  {
                    quantity: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input:
                                  "$products",
                                as: "detail",
                                cond: {
                                  $eq: [
                                    "$$detail.productId",
                                    "$$cat._id"
                                  ]
                                }
                              }
                            },
                            as: "products",
                            in: "$$products.quantity"
                          }
                        },
                        0
                      ]
                    },
                    mainProductOrderId: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: {
                              $filter: {
                                input:
                                  "$products",
                                as: "detail",
                                cond: {
                                  $eq: [
                                    "$$detail.productId",
                                    "$$cat._id"
                                  ]
                                }
                              }
                            },
                            as: "products",
                            in: "$$products._id"
                          }
                        },
                        0
                      ]
                    },
                  }
                ]
              }
            }
          }
        }
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
        $match: condition
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "products.productDetails"
        }
      },
      {
        $unwind: {
          path: "$products.productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$_id",
          firstname: {
            $first: "$firstname"
          },
          lastname: {
            $first: "$lastname"
          },
          email: {
            $first: "$email"
          },
          phone: {
            $first: "$phone"
          },
          machineId: {
            $first: "$machineId"
          },
          storeId: {
            $first: "$storeId"
          },
          paymentMade: {
            $first: "$paymentMade"
          },
          paymentStatus: {
            $first: "$paymentStatus"
          },
          paymentMode: {
            $first: "$paymentMode"
          },
          cardReferenceNumber: {
            $first: "$cardReferenceNumber"
          },
          status: {
            $first: "$status"
          },
          isCancel: {
            $first: "$isCancel"
          },
          isDeleted: {
            $first: "$isDeleted"
          },
          createdAt: {
            $first: "$createdAt"
          },
          updatedAt: {
            $first: "$updatedAt"
          },
          deletedAt: {
            $first: "$deletedAt"
          },
          orderNumber: {
            $first: "$orderNumber"
          },
          products: {
            $push: "$products"
          }
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

orderController.dashboardCountForStore = async (req, res, next) => {
  try {

    let orderQuery = [
      {
        $match: {
          storeId: convertIdToObjectId(req.query.storeId ? req.query.storeId : req.store._id.toString())
        }
      },
    ]

    let orderList = await OrderModel.aggregate(orderQuery)

    let paymentMadeData = await OrderModel.aggregate([
      {
        $match: {
          storeId: convertIdToObjectId(req.query.storeId ? req.query.storeId : req.store._id.toString())
        }
      },
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
      totalOrder: orderList.length,
      totalPayment: paymentMadeData.length > 0 ? paymentMadeData[0].payment : 0,
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

orderController.orderChartDataForStore = async (req, res, next) => {
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
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString())
        }
      },
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
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$productDetails.category",
          count: {
            $sum: 1
          },
          paymentMade: {
            $sum: "$paymentMade"
          }
        }
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          paymentMade: 1,
          categoryName: {
            $arrayElemAt: ["$categoryDetails.name", 0]
          }
        }
      }
    ]

    let result = await OrderModel.aggregate(query);

    createResponse(result, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

/* gold type base order data */
orderController.goldTypeChartData = async (req, res, next) => {
  try {

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
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            $ifNull: [
              "$products.goldType",
              "10"
            ]
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          goldType: "$_id",
          count: 1
        }
      }
    ]

    let result = await OrderModel.aggregate(query);

    createResponse(result, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}


/* Category base order data for Store */
orderController.orderChartCategoryBaseDataForStore = async (req, res, next) => {
  try {

    let query = [
      {
        $match: {
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString())
        }
      },
      {
        $match: {
          createdAt: {
            $gte: new Date(req.body.startDate), // Ensure the correct range
            $lt: new Date(req.body.endDate)
          }
        }
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$productDetails.category",
          count: {
            $sum: 1
          },
          paymentMade: {
            $sum: "$paymentMade"
          }
        }
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          paymentMade: 1,
          categoryName: {
            $arrayElemAt: ["$categoryDetails.name", 0]
          }
        }
      }
    ]

    let result = await OrderModel.aggregate(query);

    createResponse(result, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

/* gold type base order data for Store */
orderController.goldTypeChartDataForStore = async (req, res, next) => {
  try {

    let query = [
      {
        $match: {
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString())
        }
      },
      {
        $match: {
          createdAt: {
            $gte: new Date(req.body.startDate), // Ensure the correct range
            $lt: new Date(req.body.endDate)
          }
        }
      },
      {
        $unwind: {
          path: "$products",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "products.productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: {
            $ifNull: [
              "$productDetails.goldType",
              "10"
            ]
          },
          count: {
            $sum: 1
          }
        }
      },
      {
        $project: {
          _id: 0,
          goldType: "$_id",
          count: 1
        }
      }
    ]

    let result = await OrderModel.aggregate(query);

    createResponse(result, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

/* update order status */
orderController.deleteOrder = async (req, res, next) => {
  try {

    let orderDetails = await OrderModel.findOne({ _id: convertIdToObjectId(req.query._id) });

    orderDetails.isCancel = true;
    orderDetails.save();

    createResponse(null, 200, "order deleted successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { orderController }
