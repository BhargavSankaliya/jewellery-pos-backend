const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { productController } = require('../controllers/productController');
const { productModel } = require('../models/productModel');


//ads create and update api (if update then _id pass in query)
router.post("/create-update", validateSchema(productModel), productController.createUpdateProduct);

// ads list and active list if query isActive:true then
router.get("/list", productController.list);

// ads list and active list if query isActive:true then
router.get("/list-for-store", productController.listForStore);

// ads details
router.get("/getById", productController.getByAdsId);

// ads delete
router.delete("", productController.adsDelete);

// ads status update _id query
router.get("/update-status", productController.updateAdsStatus);


module.exports = router