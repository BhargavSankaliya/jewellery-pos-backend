const { convertIdToObjectId } = require("../controllers/authController");

const commonFilter = {};

commonFilter.storeCommonObject = {
    _id: 1,
    id: "$_id",
    storeName: 1,
    logo: 1,
    address: 1,
    pincode: 1,
    country: 1,
    state: 1,
    city: 1,
    description: 1,
    gstNumber: 1,
    phone: 1,
    email: 1,
    instagramUrl: 1,
    facebookUrl: 1,
    youtubeUrl: 1,
    twitterUrl: 1,
    jobTitle: 1,
    businessType: 1,
    companyName: 1,
    theme: 1,
    color: 1,
    companyWebsite: 1,
    locations: 1,
    status: 1,
    role: 1
}

commonFilter.machineCommonObject = {
    _id: 1,
    id: "$_id",
    storeId: 1,
    ads: 1,
    deviceNumber: 1,
    status: 1,
    machineId: 1,
    machineName: 1,
    storeDetails: 1
}

commonFilter.adsObject = {
    id: "$_id",
    url: 1,
    type: 1,
    status: 1
}

commonFilter.productCategoryObject = {
    id: "$_id",
    name: 1,
    image: 1,
    status: 1
}

commonFilter.couponObject = {
    _id: 1,
    id: "$_id",
    storeId: 1,
    couponId: 1,
    userEmail: 1,
    storeDetails: 1,
    name: 1,
    description: 1,
    discount: 1,
    minOrderRequired: 1,
    startDate: 1,
    endDate: 1,
    usageCount: 1,
    remainingCount: 1,
    status: 1,
}

commonFilter.calculateProductPrice = (storeId) => {
    return [
        {
            $lookup: {
                from: "stores",
                let: {
                    storeId: convertIdToObjectId(storeId)
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
        }
    ]
}

commonFilter.productObject = {
    id: "$_id",
    productUniqueNumber: 1,
    name: 1,
    description: 1,
    files: 1,
    mrp: 1,
    actualPrice: 1,
    devidation: 1,
    category: 1,
    productCategoryDetails: 1,
    subCategory: 1,
    gender: 1,
    stocks: 1,
    grossWeight: 1,
    grossWeightName: 1,
    diaWeight: 1,
    diaWeightName: 1,
    colorSTWeight: 1,
    colorSTWeightName: 1,
    stoneColor: 1,
    stoneType: 1,
    mainStoneWeight: 1,
    mainStoneWeightName: 1,
    diaPcs: 1,
    colorStPcs: 1,
    mainStonePcs: 1,
    status: 1,

}

commonFilter.paginationCalculation = async (list, limit, page) => {
    return {
        currentPage: page,
        limit: limit,
        isLastPage: list.length >= limit ? false : true
    }
}


module.exports = { commonFilter };