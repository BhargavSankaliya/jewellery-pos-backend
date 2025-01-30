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

// get sub category list api
router.get("/sub-categories", machineAuthController.activeSubCategories);

// get product list api
router.post("/products", machineAuthController.activeProducts);

// get product details api
router.get("/products", machineAuthController.getProductDetails);

// get add to cart api
router.post("/addToCart", machineAuthController.addToCartInItem);

// get cart details api
router.get("/cart-details", machineAuthController.orderCartDetails);

// get update count api
router.post("/cart-quantity-addRemove", machineAuthController.updateQuantityOFOrder);

// remove all items in cart api
router.get("/cart-remove-allItems", machineAuthController.cartRemoveAllItemFromOrder);

// generate order api
router.post("/order", validateSchema(OrderModel), machineAuthController.order);

module.exports = router