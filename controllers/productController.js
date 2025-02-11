const { CustomError, errorHandler } = require("../middlewares/error.js");
const mongoose = require("mongoose");
const config = require("../environmentVariable.json");
const createResponse = require("../middlewares/response.js");
const { convertIdToObjectId } = require("./authController.js");
const productModel = require("../models/productModel.js");
const productController = {};

productController.createUpdateProduct = async (req, res, next) => {
  try {
    req.body.category = convertIdToObjectId(req.body.category);

    if (req.query && !!req.query._id) {
      let productData = await productModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, req.body, { upsert: true })
      createResponse(productData, 200, "Product Updated Successfully.", res);
      return
    }

    let productData = await productModel.create(req.body);

    createResponse(productData, 200, "Product Created Successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.list = async (req, res, next) => {
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

    let aggragationQuery = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "category",
          foreignField: "_id",
          as: "productCategoriesDetails",
        },
      },
      {
        $unwind: {
          path: "$productCategoriesDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategoriesDetails",
        },
      },
      {
        $addFields: {
          categoryName: "$productCategoriesDetails.name",
          subCategoryName: "$subCategoriesDetails.name",
        },
      },
    ]

    let productList = await productModel.aggregate(aggragationQuery);
    if (productList.length != 0) {
      createResponse(productList, 200, "Ads list fetched successfully.", res);
      return
    }

    createResponse([], 200, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.listForStore = async (req, res, next) => {
  try {
    let query = [
      {
        $lookup: {
          from: "productcategories",
          localField: "category",
          foreignField: "_id",
          as: "productCategoriesDetails",
        },
      },
      {
        $unwind: {
          path: "$productCategoriesDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "productcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategoriesDetails",
        },
      },
      {
        $addFields: {
          categoryName: "$productCategoriesDetails.name",
          subCategoryName: "$subCategoriesDetails.name",
        },
      },
      {
        $lookup: {
          from: "stores",
          let: {
            storeId: convertIdToObjectId(req.store._id.toString())
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
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    productNaturalPrice: {
                      $cond: {
                        if: {
                          $gt: ["$devidation", 0]
                        },
                        then: {
                          $divide: [
                            "$$item.diamondTypeNaturalMRP",
                            "$devidation"
                          ]
                        },
                        else: "$$item.diamondTypeNaturalMRP"
                      }
                    },
                    productLabGrownPrice: {
                      $cond: {
                        if: {
                          $gt: ["$devidation", 0]
                        },
                        then: {
                          $divide: [
                            "$$item.diamondTypeLabGrownMRP",
                            "$devidation"
                          ]
                        },
                        else: "$$item.diamondTypeLabGrownMRP"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    storeProductNaturalPrice: {
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
                        then: {
                          $add: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    "$$item.diamondTypeNaturalMRP",
                                    "$devidation"
                                  ]
                                },
                                "$storePrice"
                              ]
                            },
                            "$$item.productNaturalPrice"
                          ]
                        },
                        else: {
                          $divide: [
                            "$$item.diamondTypeNaturalMRP",
                            "$devidation"
                          ]
                        }
                      }
                    },
                    storeProductLabGrownPrice: {
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
                        then: {
                          $add: [
                            {
                              $multiply: [
                                {
                                  $divide: [
                                    "$$item.diamondTypeLabGrownMRP",
                                    "$devidation"
                                  ]
                                },
                                "$storePrice"
                              ]
                            },
                            "$$item.productLabGrownPrice"
                          ]
                        },
                        else: {
                          $divide: [
                            "$$item.diamondTypeLabGrownMRP",
                            "$devidation"
                          ]
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  {
                    actualNaturalPrice: {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $gt: [
                                "$storeDiscount",
                                0
                              ]
                            },
                            {
                              $gt: [
                                "$$item.storeProductNaturalPrice",
                                0
                              ]
                            }
                          ]
                        },
                        then: {
                          $subtract: [
                            "$$item.storeProductNaturalPrice",
                            {
                              $multiply: [
                                "$$item.storeProductNaturalPrice",
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
                        else: "$$item.storeProductNaturalPrice"
                      }
                    },
                    actualLabGrownPrice: {
                      $cond: {
                        if: {
                          $and: [
                            {
                              $gt: [
                                "$storeDiscount",
                                0
                              ]
                            },
                            {
                              $gt: [
                                "$$item.storeProductLabGrownPrice",
                                0
                              ]
                            }
                          ]
                        },
                        then: {
                          $subtract: [
                            "$$item.storeProductLabGrownPrice",
                            {
                              $multiply: [
                                "$$item.storeProductLabGrownPrice",
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
                        else: "$$item.storeProductLabGrownPrice"
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      {
        $unwind: {
          path: "$items",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          diamondShape: "$items.diamondShape",
          diamondShapeImage:
            "$items.diamondShapeImage",
          goldType: "$items.goldType",
          bandWidth: "$items.bandWidth",
          stocks: "$items.stocks",
          goldTypeColor: "$items.goldTypeColor",
          files: "$items.files",
          actualNaturalPrice:
            "$items.actualNaturalPrice",
          actualLabGrownPrice:
            "$items.actualLabGrownPrice",
          itemId: "$items._id"
        }
      }
    ]

    let response = await productModel.aggregate(query);

    createResponse(response.length > 0 ? response : [], 200, "fetched successfully", res);

  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.getByAdsId = async (req, res, next) => {
  try {

    let productDetails = await productModel.findById(req.query._id);
    if (!!productDetails) {
      createResponse(productDetails, 200, "Ads Details fetched successfully.", res);
      return
    }

    createResponse(null, 404, "No category found.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.adsDelete = async (req, res, next) => {
  try {
    let productDelete = await productModel.findOneAndDelete({ _id: convertIdToObjectId(req.query._id) });
    createResponse(productDelete, 200, "Ads deleted successfully.", res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

productController.updateAdsStatus = async (req, res, next) => {
  try {

    let productDetails = await productModel.findById(req.query._id)

    if (!productDetails) {
      throw new CustomError("Ads not found.", 400);
    }

    let status = productDetails.status == 'Active' ? 'Inactive' : 'Active'

    await productModel.findOneAndUpdate({ _id: convertIdToObjectId(req.query._id) }, { status });

    createResponse({ status }, 200, status == 'Active' ? 'Activated Successfully.' : 'Inactivated Successfuly.', res);
  } catch (error) {
    errorHandler(error, req, res)
  }
}

module.exports = { productController }
