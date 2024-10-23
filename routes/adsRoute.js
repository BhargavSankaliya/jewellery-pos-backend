const express = require('express');

const router = express.Router()
const { validateSchema } = require('../models/baseModel');
const AdsModel = require('../models/adsModel');
const { adsController } = require('../controllers/adsController');


//ads create and update api (if update then _id pass in query)
router.post("/create", validateSchema(AdsModel), adsController.createAds);

// ads list and active list if query isActive:true then
router.get("/list", adsController.list);

// ads details
router.get("/getById", adsController.getByAdsId);

// ads delete
router.delete("/delete", adsController.adsDelete);

// ads status update _id query
router.get("/update-status", adsController.updateAdsStatus);


module.exports = router