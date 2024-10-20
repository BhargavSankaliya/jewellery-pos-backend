const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { CustomError, errorHandler } = require("../middlewares/error");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { MachineModel } = require("../models/machineModel.js");
const StoreModel = require("../models/storeModel.js");
const { commonFilter } = require("../middlewares/commonFilter.js");
const AdsModel = require("../models/adsModel.js");
const ProductCategory = require("../models/productCategoryModel.js");
const { convertIdToObjectId } = require("./authController.js");
const productModel = require("../models/productModel.js");
const OrderModel = require("../models/orderModel.js");
const machineAuthController = {}

// Login API
machineAuthController.loginMachine = async (req, res, next) => {
    try {
        const { machineId, pin } = req.body;

        if (!machineId) {
            throw new CustomError(
                "Machine Id is required!",
                400
            );
        }

        if (!pin) {
            throw new CustomError(
                "PIN is required for login!",
                400
            );
        }

        let machine = await MachineModel.findOne({ machineId: machineId, isDeleted: false });

        if (!machine) {
            throw new CustomError("Machine not found!", 404);
        }

        if (machine.status == 'Inactive') {
            throw new CustomError("Machine is not activated!", 404);
        }

        const match = machine.pin == pin;
        if (!match) {
            throw new CustomError("Wrong credentials!", 400);
        }

        const token = jwt.sign({ _id: machine._id }, config.JWT_SECRET, {
            expiresIn: "90d",
        });

        machine.jwtToken = token;
        machine.save();

        let storeDetails = await StoreModel.findById(machine.storeId);

        let responseObject = {
            storeId: machine.storeId,
            storeDetails: {
                companyName: storeDetails.companyName,
                address: storeDetails.address,
                state: storeDetails.state,
                pinCode: storeDetails.pinCode,
                country: storeDetails.country,
                city: storeDetails.city,
                logo: storeDetails.logo,
                description: storeDetails.description,
                gstNumber: storeDetails.gstNumber,
                phone: storeDetails.phone,
                email: storeDetails.email,
                backgroundColor: storeDetails.backgroundColor,
                fontColor: storeDetails.fontColor,
                jobTitle: storeDetails.jobTitle,
                businessType: storeDetails.businessType,
                storeName: storeDetails.storeName,
                companyWebsite: storeDetails.companyWebsite,
                instagramUrl: storeDetails.instagramUrl,
                facebookUrl: storeDetails.facebookUrl,
                youtubeUrl: storeDetails.youtubeUrl,
                twitterUrl: storeDetails.twitterUrl,
                locations: storeDetails.locations,
                role: storeDetails.role,
                status: storeDetails.status,
            },
            ads: machine.ads,
            deviceNumber: machine.deviceNumber,
            status: machine.status,
            isDeleted: machine.isDeleted,
            machineId: machine.machineId,
            machineName: machine.machineName,
            token: token
        }

        createResponse(responseObject, 200, "Login Successfully.", res);
    } catch (error) {
        errorHandler(error, req, res)
    }
};

machineAuthController.machineDetails = async (req, res, next) => {
    try {
        let machine = req.machine;

        let findMachineDetails = [
            {
                $match: {
                    _id: machine._id
                }
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
                $project: commonFilter.machineCommonObject
            }
        ]


        let machineDetails = await MachineModel.aggregate(findMachineDetails);
        if (!machineDetails) {
            throw new CustomError("Machine Details is not found.", 400);
        }

        return createResponse(machineDetails[0], 200, 'Machine Details Fetched Successfully.', res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.currentAds = async (req, res, next) => {
    try {

        let checkAdsOfMachine = req.machine.ads && req.machine.ads.length > 0 ? req.machine.ads : null;

        let condition = {};
        condition["$and"] = [];

        condition["$and"].push({
            isDeleted: false
        });

        if (checkAdsOfMachine) {
            condition["$and"].push({
                $expr: {
                    $in: ["$_id", checkAdsOfMachine]
                }
            });
        }

        let adsPipeline = [
            {
                $match: condition
            },
            {
                $project: commonFilter.adsObject
            }
        ]

        let getAllAds = await AdsModel.aggregate(adsPipeline);
        if (!getAllAds || getAllAds.length == 0) {
            return createResponse(getAllAds, 200, 'Machine ads Fetched Successfully.', res)
        }
        return createResponse(getAllAds, 200, 'Machine ads Fetched Successfully.', res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.activeCategories = async (req, res, next) => {
    try {

        let categoryPipeline = [
            {
                $match: {
                    isDeleted: false,
                    status: 'Active'
                }
            },
            {
                $project: commonFilter.productCategoryObject
            }
        ]

        let getAllCategories = await ProductCategory.aggregate(categoryPipeline);
        if (!getAllCategories || getAllCategories.length == 0) {
            return createResponse([], 200, "categories fetched successfully", res)
        }
        return createResponse(getAllCategories, 200, "categories fetched successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.activeProducts = async (req, res, next) => {
    try {

        let condition = {};
        condition["$and"] = [];

        condition["$and"].push({
            isDeleted: false
        });

        condition["$and"].push({
            status: 'Active'
        });

        if (req.body.category != 'null' && !!req.body.category) {
            condition["$and"].push({
                category: convertIdToObjectId(req.body.category)
            });
        }
        if (req.body.gender != 'null' && !!req.body.gender) {
            condition["$and"].push({
                $expr: {
                    $in: [req.body.gender, "$gender"]
                }
            });
        }
        if (req.body.stoneType != 'null' && !!req.body.stoneType) {
            condition["$and"].push({
                stoneType: req.body.stoneType
            });
        }
        if (req.body.subCategory != 'null' && !!req.body.subCategory) {
            condition["$and"].push({
                $expr: {
                    $gt: [
                        {
                            $size: {
                                $filter: {
                                    input: "$subCategory",
                                    as: "subCat",
                                    cond: { $in: ["$$subCat", req.body.subCategory] }
                                }
                            }
                        },
                        0
                    ]
                }
            });

        }
        if (req.body.minValue != 'null' && !!req.body.minValue && req.body.maxValue != 'null' && !!req.body.maxValue) {
            condition["$and"].push({
                actualPrice: {
                    $gte: parseFloat(req.body.minValue),
                    $lte: parseFloat(req.body.maxValue)
                }
            });
        }

        const calculateProductPrice = await commonFilter.calculateProductPrice(req.machine.storeId)

        let categoryPipeline = [
            ...calculateProductPrice,
            {
                $match: condition
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

        let getAllProducts = await productModel.aggregate(categoryPipeline);
        if (!getAllProducts || getAllProducts.length == 0) {
            return createResponse([], 200, "Products fetched successfully", res)
        }
        return createResponse(getAllProducts, 200, "Products fetched successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.getProductDetails = async (req, res, next) => {
    try {

        let condition = {};
        condition["$and"] = [];

        condition["$and"].push({
            isDeleted: false
        });
        condition["$and"].push({
            _id: convertIdToObjectId(req.query.productId)
        });

        condition["$and"].push({
            status: 'Active'
        });

        if (req.body.category != 'null' && !!req.body.category) {
            condition["$and"].push({
                category: convertIdToObjectId(req.body.category)
            });
        }
        if (req.body.gender != 'null' && !!req.body.gender) {
            condition["$and"].push({
                $expr: {
                    $in: [req.body.gender, "$gender"]
                }
            });
        }
        if (req.body.stoneType != 'null' && !!req.body.stoneType) {
            condition["$and"].push({
                stoneType: req.body.stoneType
            });
        }
        if (req.body.subCategory != 'null' && !!req.body.subCategory) {
            condition["$and"].push({
                $expr: {
                    $in: ["$subCategory", req.body.subCategory]
                }
            });
        }
        if (req.body.minValue != 'null' && !!req.body.minValue && req.body.maxValue != 'null' && !!req.body.maxValue) {
            condition["$and"].push({
                actualPrice: {
                    $gte: parseFloat(req.body.minValue),
                    $lte: parseFloat(req.body.maxValue)
                }
            });
        }

        const calculateProductPrice = await commonFilter.calculateProductPrice(req.machine.storeId)

        let categoryPipeline = [
            ...calculateProductPrice,
            {
                $match: condition
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

        let getAllProducts = await productModel.aggregate(categoryPipeline);
        if (!getAllProducts || getAllProducts.length == 0) {
            return createResponse(null, 200, "Products fetched successfully", res)
        }
        return createResponse(getAllProducts[0], 200, "Products fetched successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.order = async (req, res, next) => {
    try {

        let bodyData = req.body;

        if (bodyData.paymentMade > 0) {
            bodyData.paymentStatus = "Paid"
        }
        else {
            bodyData.paymentStatus = "Not Paid"
        }

        bodyData.machineId = req.machine._id;

        bodyData.products = bodyData.products.map((x) => { return { productId: convertIdToObjectId(x.productId), quantity: parseInt(x.quantity) } });

        let orderCreate = await OrderModel.create(bodyData);

        return createResponse(orderCreate, 200, "Order Placed Successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

module.exports = {
    machineAuthController
};
