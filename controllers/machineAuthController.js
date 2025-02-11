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
const AddToCartModel = require("../models/addToCartModel.js");
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
                    status: 'Active',
                    parentCategory: null
                }
            },
            {
                $project: commonFilter.productCategoryObject
            },
            {
                $sort: {
                    order: 1
                }
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

machineAuthController.activeSubCategories = async (req, res, next) => {
    try {

        let categoryPipeline = [
            {
                $match: {
                    isDeleted: false,
                    status: 'Active',
                    parentCategory: {
                        $eq: convertIdToObjectId(req.query.parentCategory)
                    }
                }
            },
            {
                $project: commonFilter.productCategoryObject
            },
            {
                $sort: {
                    order: 1
                }
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
        if (req.body.mostSelling) {
            condition["$and"].push({
                mostSelling: true
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

        if (!!req.body.search) {
            condition["$and"].push(
                {
                    $or: [
                        {
                            'name': {
                                $regex: '.*' + (req.body.search || '') + '.*',
                                $options: 'i',
                            },
                        },
                        {
                            'productDisplay': {
                                $regex: '.*' + (req.body.search || '') + '.*',
                                $options: 'i',
                            },
                        },
                    ]
                }
            );
        }
        if (req.body.subCategory != 'null' && !!req.body.subCategory) {

            req.body.subCategory = req.body.subCategory.map((x) => convertIdToObjectId(x))

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
                "items.actualNaturalPrice": {
                    $gte: parseFloat(req.body.minValue),
                    $lte: parseFloat(req.body.maxValue)
                }
            });
        }

        const calculateProductPrice = await commonFilter.calculateProductDiamondTypePrice(req.machine.storeId)

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
                $lookup: {
                    from: "productcategories",
                    localField: "subCategory",
                    foreignField: "_id",
                    as: "productSubCategoryList",
                    pipeline: [
                        {
                            $project: commonFilter.productCategoryObject
                        }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$productSubCategoryList",
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


        getAllProducts.map((x) => {
            x.items.map((y) => {
                y.actualNaturalPrice = parseFloat(y.actualNaturalPrice.toFixed(2));
                y.actualLabGrownPrice = parseFloat(y.actualLabGrownPrice.toFixed(2));
                y.storeProductNaturalPrice = parseFloat(y.storeProductNaturalPrice.toFixed(2));
                y.storeProductLabGrownPrice = parseFloat(y.storeProductLabGrownPrice.toFixed(2));
                y.productNaturalPrice = parseFloat(y.productNaturalPrice.toFixed(2));
                y.productLabGrownPrice = parseFloat(y.productLabGrownPrice.toFixed(2));
                y.labGrownStock = y.labGrownStock ? y.labGrownStock : 0;

                y.media = [];
                if (y.files && y.files.length > 0) {
                    y.files.map((z, i) => {
                        y.media.push({ url: z, type: 'image' });
                        if (y.videos && y.videos.length > 0 && i == 0) {
                            y.videos.map((t) => {
                                y.media.push({ url: t, type: 'video' })
                            })
                        }
                    })
                }
                if (y.files && y.files.length == 0 && y.videos && y.videos.length > 0) {
                    y.videos.map((t) => {
                        y.media.push({ url: t, type: 'video' })
                    })
                }
            })
        })
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
                "items.actualNaturalPrice": {
                    $gte: parseFloat(req.body.minValue),
                    $lte: parseFloat(req.body.maxValue)
                }
            });
        }

        const calculateProductPrice = await commonFilter.calculateProductDiamondTypePrice(req.machine.storeId)

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

        getAllProducts.map((x) => {
            x.items.map((y) => {
                y.actualNaturalPrice = parseFloat(y.actualNaturalPrice.toFixed(2));
                y.actualLabGrownPrice = parseFloat(y.actualLabGrownPrice.toFixed(2));
                y.storeProductNaturalPrice = parseFloat(y.storeProductNaturalPrice.toFixed(2));
                y.storeProductLabGrownPrice = parseFloat(y.storeProductLabGrownPrice.toFixed(2));
                y.productNaturalPrice = parseFloat(y.productNaturalPrice.toFixed(2));
                y.productLabGrownPrice = parseFloat(y.productLabGrownPrice.toFixed(2));
                y.labGrownStock = y.labGrownStock ? y.labGrownStock : 0;

                y.media = [];
                if (y.files && y.files.length > 0) {
                    y.files.map((z, i) => {
                        y.media.push({ url: z, type: 'image' });
                        if (y.videos && y.videos.length > 0 && i == 0) {
                            y.videos.map((t) => {
                                y.media.push({ url: t, type: 'video' })
                            })
                        }
                    })
                };

                if (y.files && y.files.length == 0 && y.videos && y.videos.length > 0) {
                    y.videos.map((t) => {
                        y.media.push({ url: t, type: 'video' })
                    })
                }

            })
        })

        return createResponse(getAllProducts[0], 200, "Products fetched successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.order = async (req, res, next) => {
    try {

        let bodyData = req.body;


        bodyData.machineId = req.machine._id;
        bodyData.storeId = req.machine.storeId;

        bodyData.products = bodyData.products.map((x) => { return { ...x, productId: convertIdToObjectId(x.productId), itemId: convertIdToObjectId(x.itemId), mrp: parseFloat(x.mrp), quantity: parseInt(x.quantity) } });

        for (const x of bodyData.products) {
            let findProduct = await productModel.findById(x.productId);

            if (!findProduct || !findProduct.items || findProduct.items.length === 0) {
                throw new CustomError("Product not found or no items available.", 404);
            }

            let itemFound = false;

            for (const y of findProduct.items) {
                if (y._id.toString() === x.itemId.toString()) {
                    if (x.diamondType === 'Natural') {
                        if (y.stocks > 0 && y.stocks >= x.quantity) {
                            y.stocks -= x.quantity;
                            itemFound = true;
                        } else {
                            throw new CustomError("Natural Diamond Out of Stock.", 404);
                        }
                    } else {
                        if (y.labGrownStock > 0 && y.labGrownStock >= x.quantity) {
                            y.labGrownStock -= x.quantity;
                            itemFound = true;
                        } else {
                            throw new CustomError("Lab Grown Diamond Out of Stock.", 404);
                        }
                    }
                    break; // Stop loop once we find and update the item
                }
            }

            if (!itemFound) {
                throw new CustomError("Item not found in product.", 404);
            }

            await findProduct.save(); // Ensure changes are saved
        }

        bodyData.paymentMade = 0;

        bodyData.products.map((x) => {
            bodyData.paymentMade = bodyData.paymentMade + parseFloat(x.totalPrice);
        })

        if (bodyData.paymentMade > 0) {
            bodyData.paymentStatus = "Paid"
        }
        else {
            bodyData.paymentStatus = "Not Paid"
        }


        let orderCreate = await OrderModel.create(bodyData);
        await AddToCartModel.deleteMany({ machineId: convertIdToObjectId(req.machine._id.toString()) });
        return createResponse(orderCreate, 200, "Order Placed Successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}


machineAuthController.addToCartInItem = async (req, res, next) => {
    try {

        let bodyData = req.body;

        bodyData.machineId = req.machine._id;

        bodyData.productId = convertIdToObjectId(req.body.productId);
        bodyData.itemId = convertIdToObjectId(bodyData.itemId);
        bodyData.quantity = parseInt(bodyData.quantity);

        bodyData.totalPrice = parseFloat(bodyData.quantity * bodyData.actualPrice);

        let orderCreate = await AddToCartModel.create(bodyData);

        return createResponse(orderCreate, 200, "Item added in cart Successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.updateQuantityOFOrder = async (req, res, next) => {
    try {

        let bodyData = req.body;

        let findProduct = await AddToCartModel.findOne({ _id: convertIdToObjectId(bodyData._id) });

        if (!!findProduct && bodyData.type == 1) {
            if (findProduct.quantity == 1) {
                await AddToCartModel.deleteOne({ _id: findProduct._id })
            }
            else {
                findProduct.quantity = findProduct.quantity - 1;
                findProduct.totalPrice = (findProduct.actualPrice * findProduct.quantity).toFixed(2);
                await findProduct.save();
            }
        }
        else if (!!findProduct && bodyData.type == 2) {
            findProduct.quantity = findProduct.quantity + 1;
            findProduct.totalPrice = (findProduct.actualPrice * findProduct.quantity).toFixed(2);
            await findProduct.save();
        }

        return createResponse(findProduct, 200, "In cart update quantity Successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.getCartOrdderCount = async (req, res, next) => {
    try {

        let findProduct = await AddToCartModel.aggregate([{ $match: { machineId: convertIdToObjectId(req.machine._id.toString()) } }]);

        return createResponse({ count: findProduct.length > 0 ? findProduct.length : 0 }, 200, "Cart Count Fetched Successfully.", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.cartRemoveAllItemFromOrder = async (req, res, next) => {
    try {

        let bodyData = req.body;

        let findProduct = await AddToCartModel.deleteMany({ machineId: convertIdToObjectId(req.machine._id.toString()) });

        return createResponse(null, 200, "Remove All items in cart", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}

machineAuthController.orderCartDetails = async (req, res, next) => {
    try {

        let findProduct = await AddToCartModel.aggregate(
            [
                {
                    $match: {
                        machineId: convertIdToObjectId(req.machine._id.toString())
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "productDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$productDetails",
                        preserveNullAndEmptyArrays: true
                    }
                }
            ]
        );

        return createResponse(findProduct, 200, "All items Fetched successfully", res)

    } catch (error) {
        errorHandler(error, req, res, next)
    }
}


module.exports = {
    machineAuthController
};
