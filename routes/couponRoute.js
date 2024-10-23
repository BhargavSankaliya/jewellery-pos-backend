const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const CouponModel = require('../models/couponModel');
const { couponsController } = require('../controllers/couponsController');

//ads create and update api (if update then _id pass in query)
router.post("/create", validateSchema(CouponModel), couponsController.createCoupons);

// router.get("/list", couponsController.list);

// // ads details
// router.get("/getById", couponsController.getByAdsId);

// // ads delete
// router.delete("/delete", couponsController.adsDelete);

// // ads status update _id query
// router.get("/update-status", couponsController.updateAdsStatus);


module.exports = router