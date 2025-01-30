const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const ProductCategory = require('../models/productCategoryModel');
const { productCategoryController } = require('../controllers/productCategoryController');


//Category create and update api (if update then _id pass in query)
router.post("/create-update", validateSchema(ProductCategory), productCategoryController.createupdate);

// category list and active list if query isActive:true then
router.get("/list", productCategoryController.list);

// category list and active list if query isActive:true then
router.get("/parentCategory", productCategoryController.parentCategory);

// category list and active list if query isActive:true then
router.get("/sub-Category", productCategoryController.subCategory);

// category list and active list if query isActive:true then
router.get("/getById", productCategoryController.getByCategoryId);

// category status update _id query
router.get("/update-status", productCategoryController.udpateCatgoryStatus);


module.exports = router