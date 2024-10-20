const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const { machineAuthController } = require('../controllers/machineAuthController');
const OrderModel = require('../models/orderModel');

// get machine details api 
router.get("/machine-details", machineAuthController.machineDetails);

// get ads list api
router.get("/current-ads", machineAuthController.currentAds);

// get category list api
router.get("/categories", machineAuthController.activeCategories);

// get category list api
router.post("/products", machineAuthController.activeProducts);

// get category list api
router.get("/products", machineAuthController.getProductDetails);

// get category list api
router.post("/order", validateSchema(OrderModel), machineAuthController.order);

module.exports = router