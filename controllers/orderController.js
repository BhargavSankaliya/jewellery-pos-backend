const { CustomError, errorHandler } = require("../middlewares/error.js");
const createResponse = require("../middlewares/response.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const OrderModel = require("../models/orderModel.js");
const { convertIdToObjectId } = require("./authController.js");
const StoreModel = require("../models/storeModel.js");
const { MachineModel } = require("../models/machineModel.js");
const { sendEmailForMeta } = require("../helper/otpHelper.js");
const orderController = {};
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const config = require("../environmentVariable.json");
const fs = require('fs');
const { PDFDocument } = require("pdf-lib");
const moment = require("moment");


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
          remark: {
            $first: "$remark"
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
        $match: {
          isCancel: false
        }
      },
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
          storeId: convertIdToObjectId(req.query.storeId ? req.query.storeId : req.store._id.toString()),
          isCancel: false
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
          },
          isCancel: false
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
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString()),
          isCancel: false
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
          },
          isCancel: false
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
          },
          isCancel: false
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
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString()),
          isCancel: false
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
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString()),
          isCancel: false
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

/* sub category wise base order data */
orderController.subCategoryWiseChatData = async (req, res, next) => {
  try {

    let query = [
      {
        $match: {
          isCancel: false,
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
        $group: {
          _id: {
            $arrayElemAt: [
              "$products.productDetails.subCategory",
              0
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
          subcategoryId: "$_id",
          count: 1
        }
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategoryDetails"
        }
      },
      {
        $unwind: {
          path: "$subcategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          categoryName: "$subcategoryDetails.name"
        }
      }
    ]

    if (req.body.subCategory && req.body.subCategory != 'null') {

      query.push({
        $match: {
          subcategoryId: convertIdToObjectId(req.body.subCategory)
        }
      })
    }

    let result = await OrderModel.aggregate(query);

    createResponse(result, 200, "count get successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

/* sub category wise store base order data */
orderController.subCategoryWiseChatDataForStore = async (req, res, next) => {
  try {

    let query = [
      {
        $match: {
          storeId: convertIdToObjectId(req.body.storeId ? req.body.storeId : req.store._id.toString()),
          isCancel: false
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
        $group: {
          _id: {
            $arrayElemAt: [
              "$products.productDetails.subCategory",
              0
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
          subcategoryId: "$_id",
          count: 1
        }
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "subcategoryId",
          foreignField: "_id",
          as: "subcategoryDetails"
        }
      },
      {
        $unwind: {
          path: "$subcategoryDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          categoryName: "$subcategoryDetails.name"
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


// orderController.sendInvoiceMail = async (req, res, next) => {
//   try {

//     let orderObjectId = convertIdToObjectId(req.body.orderId);
//     let OrderDetails = await OrderModel.findOne({ _id: orderObjectId });

//     if (!OrderDetails) {
//       return res.status(404).json({ message: "Order not found" });
//     }


//     const transporter = nodemailer.createTransport({
//       host: config.HOST,
//       port: config.emailPORT,
//       secure: config.SECURE,
//       auth: {
//         user: config.AUTHUSER,
//         pass: config.AUTHPASSWORD,
//       },
//     });

//     // const invoicePath = req.files.invoicePDF[0].path;

//     // // Read the original PDF file
//     // const existingPdfBytes = fs.readFileSync(invoicePath);

//     // // Load the PDF document
//     // const pdfDoc = await PDFDocument.load(existingPdfBytes);

//     // // Optimize the PDF using object streams (reduces size)
//     // const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });

//     // console.log(`Original Size: ${existingPdfBytes.length / 1024} KB`);
//     // console.log(`Compressed Size: ${compressedPdfBytes.length / 1024} KB`);

//     const inputPath = req.files.invoicePDF[0].path;
//     const outputPath = inputPath.replace(".pdf", "_compressed.pdf");

//     // Compress PDF
//     await compressPDF(inputPath, outputPath);

//     // Read compressed PDF
//     const compressedPdf = fs.readFileSync(outputPath);


//     const mailOptions = {
//       from: config.AUTHUSER,
//       to: OrderDetails.email,
//       subject: `Order Created - ${OrderDetails.orderNumber}`,
//       text: `Your order has been created successfully. Please find the attached invoice.`,
//       attachments: [
//         {
//           filename: `Order_${OrderDetails.orderNumber}.pdf`,
//           content: compressedPdf,
//           contentType: "application/pdf",
//         },
//       ],
//     };

//     transporter.sendMail(mailOptions);
//     // fs.unlinkSync(inputPath);
//     createResponse(null, 200, "Mail sended successfully.", res);

//   } catch (error) {
//     errorHandler(error, req, res)
//   }
// }

async function compressPDF(inputPath, outputPath) {
  try {
    // Read input PDF
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Iterate through pages
    const pages = pdfDoc.getPages();
    for (let page of pages) {
      const { width, height } = page.getSize();
      page.setSize(width * 0.99, height * 0.99); // Slightly reduce size
    }

    // Save compressed PDF
    const compressedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, compressedPdfBytes);
    console.log("PDF Compressed Successfully");
  } catch (error) {
    console.error("Compression Error:", error);
  }
}


orderController.sendInvoiceMail = async (req, res, next) => {
  try {

    let orderObjectId = convertIdToObjectId(req.body.orderId);
    let OrderDetails = await OrderModel.findOne({ _id: orderObjectId });

    if (!OrderDetails) {
      return res.status(404).json({ message: "Order not found" });
    }

    const storeDetails = await StoreModel.findOne({ _id: convertIdToObjectId(OrderDetails.storeId) });


    const transporter = nodemailer.createTransport({
      host: config.HOST,
      port: config.emailPORT,
      secure: config.SECURE,
      auth: {
        user: config.AUTHUSER,
        pass: config.AUTHPASSWORD,
      },
    });

    // Read compressed PDF
    const htmlContent = fs.readFileSync("./htmlpages/order-pdf.html", "utf8");

    let storeAddressD = '';
    if (storeDetails.city) {
      storeAddressD = storeDetails.city + ", ";
    }
    if (storeDetails.state) {
      storeAddressD = storeAddressD + storeDetails.state + ", ";
    }
    if (storeDetails.country) {
      storeAddressD = storeAddressD + storeDetails.country + ", ";
    }
    if (storeDetails.pincode) {
      storeAddressD = storeAddressD + storeDetails.pincode + ", ";
    }

    const replacements = {
      "{{firstname}}": OrderDetails.firstname,
      "{{lastname}}": OrderDetails.lastname,
      "{{orderNumber}}": `${OrderDetails.orderNumber}`,
      "{{orderDate}}": moment(OrderDetails.createdAt).format("yyyy-MM-DD"),
      "{{totalAmount}}": OrderDetails.paymentMade,
      "{{email}}": OrderDetails.email,
      "{{phone}}": OrderDetails.phone,
      "{{storeName}}": storeDetails.storeName,
      "{{storeAddress}}": storeDetails.address,
      "{{storeAddressDetails}}": storeDetails.city ? storeDetails.city : "",
      "{{storeEmail}}": storeDetails.email,
      "{{storePhone}}": storeDetails.phone[0].countryCode + " " + storeDetails.phone[0].phoneNumber,
    };

    let modifiedHtml = htmlContent;
    for (const key in replacements) {
      modifiedHtml = modifiedHtml.replace(new RegExp(key, "g"), replacements[key]);
    }

    const mailOptions = {
      from: storeDetails.email,
      to: OrderDetails.email,
      subject: `Order Created - ${OrderDetails.orderNumber}`,
      html: modifiedHtml
    };

    transporter.sendMail(mailOptions);
    // fs.unlinkSync(inputPath);
    createResponse(null, 200, "Mail sended successfully.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}
orderController.sendInvoiceMailForMeta = async (req, res, next) => {
  try {

    let orderObjectId = convertIdToObjectId(req.body.orderId);
    let OrderDetails = await OrderModel.findOne({ _id: orderObjectId });

    if (!OrderDetails) {
      return res.status(404).json({ message: "Order not found" });
    }

    const storeDetails = await StoreModel.findOne({ _id: convertIdToObjectId(OrderDetails.storeId) });


    const transporter = nodemailer.createTransport({
      host: config.HOST,
      port: config.emailPORT,
      secure: config.SECURE,
      auth: {
        user: config.AUTHUSER,
        pass: config.AUTHPASSWORD,
      },
    });

    // Read compressed PDF
    const htmlContent = fs.readFileSync("./htmlpages/storeToMeta.html", "utf8");

    let storeAddressD = '';
    if (storeDetails.city) {
      storeAddressD = storeDetails.city + ", ";
    }
    if (storeDetails.state) {
      storeAddressD = storeAddressD + storeDetails.state + ", ";
    }
    if (storeDetails.country) {
      storeAddressD = storeAddressD + storeDetails.country + ", ";
    }
    if (storeDetails.pincode) {
      storeAddressD = storeAddressD + storeDetails.pincode + ", ";
    }

    const replacements = {
      "{{orderNumber}}": `${OrderDetails.orderNumber}`,
      "{{orderDate}}": moment(OrderDetails.createdAt).format("yyyy-MM-DD"),
      "{{totalAmount}}": OrderDetails.paymentMade,
      "{{storeName}}": storeDetails.storeName,
      "{{storeAddress}}": storeDetails.address,
      "{{storeAddressDetails}}": storeDetails.city ? storeDetails.city : "",
      "{{storeEmail}}": storeDetails.email,
      "{{storePhone}}": storeDetails.phone[0].countryCode + " " + storeDetails.phone[0].phoneNumber,
    };

    let modifiedHtml = htmlContent;
    for (const key in replacements) {
      modifiedHtml = modifiedHtml.replace(new RegExp(key, "g"), replacements[key]);
    }

    const mailOptions = {
      from: "metaonline@metajewelry.com",
      to: storeDetails.email,
      subject: `New Order Received - ${OrderDetails.orderNumber}`,
      html: modifiedHtml
    };

    transporter.sendMail(mailOptions);
    // fs.unlinkSync(inputPath);
    createResponse(null, 200, "Mail sended successfully.", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { orderController }
